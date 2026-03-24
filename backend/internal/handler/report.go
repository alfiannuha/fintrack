package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/repository"
	"github.com/fintrack/app/internal/service"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ReportHandler struct {
	db *repository.Database
}

func NewReportHandler(db *repository.Database) *ReportHandler {
	return &ReportHandler{
		db: db,
	}
}

type MonthlyReportResponse struct {
	Month                   string              `json:"month"`
	TotalIncome             int64               `json:"total_income"`
	TotalExpense            int64               `json:"total_expense"`
	NetBalance              int64               `json:"net_balance"`
	TransactionCount        int                 `json:"transaction_count"`
	Categories              []CategoryBreakdown `json:"categories"`
	DailyTotals             []DailyTotal        `json:"daily_totals"`
	TopExpenses             []TopExpense        `json:"top_expenses"`
	SavingsRate             float64             `json:"savings_rate"`
	PreviousMonthComparison *MonthComparison    `json:"previous_month_comparison"`
}

type CategoryBreakdown struct {
	CategoryID       string  `json:"category_id"`
	CategoryName     string  `json:"category_name"`
	CategoryIcon     *string `json:"category_icon,omitempty"`
	CategoryColor    *string `json:"category_color,omitempty"`
	Amount           int64   `json:"amount"`
	Percentage       float64 `json:"percentage"`
	TransactionCount int     `json:"transaction_count"`
}

type DailyTotal struct {
	Date    string `json:"date"`
	Income  int64  `json:"income"`
	Expense int64  `json:"expense"`
}

type TopExpense struct {
	CategoryID    string  `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	CategoryIcon  *string `json:"category_icon,omitempty"`
	CategoryColor *string `json:"category_color,omitempty"`
	Amount        int64   `json:"amount"`
}

type MonthComparison struct {
	IncomeChange         int64   `json:"income_change"`
	IncomeChangePercent  float64 `json:"income_change_percent"`
	ExpenseChange        int64   `json:"expense_change"`
	ExpenseChangePercent float64 `json:"expense_change_percent"`
}

func (h *ReportHandler) GetMonthlyReport(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)
	month := c.Query("month")

	var startDate time.Time
	var err error

	if month != "" {
		startDate, err = time.Parse("2006-01", month)
		if err != nil {
			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Success: false,
				Error:   "invalid month format",
			})
			return
		}
	} else {
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	}
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	report, err := h.generateMonthlyReport(c.Request.Context(), walletID, startDate, endDate, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    report,
	})
}

func (h *ReportHandler) generateMonthlyReport(ctx context.Context, walletID primitive.ObjectID, startDate, endDate time.Time, month string) (*MonthlyReportResponse, error) {
	report := &MonthlyReportResponse{
		Month: startDate.Format("2006-01"),
	}

	// Get total income
	incomeFilter := bson.M{
		"wallet_id": walletID,
		"type":      "income",
		"date": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}
	incomeResult, _ := h.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: incomeFilter}},
		{{Key: "$group", Value: bson.M{"_id": nil, "total": bson.M{"$sum": "$amount"}, "count": bson.M{"$sum": 1}}}},
	})
	if incomeResult.Next(ctx) {
		var r struct {
			Total int64 `bson:"total"`
			Count int   `bson:"count"`
		}
		incomeResult.Decode(&r)
		report.TotalIncome = r.Total
		report.TransactionCount += r.Count
	}

	// Get total expense
	expenseFilter := bson.M{
		"wallet_id": walletID,
		"type":      "expense",
		"date": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}
	expenseResult, _ := h.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: expenseFilter}},
		{{Key: "$group", Value: bson.M{"_id": nil, "total": bson.M{"$sum": "$amount"}, "count": bson.M{"$sum": 1}}}},
	})
	if expenseResult.Next(ctx) {
		var r struct {
			Total int64 `bson:"total"`
			Count int   `bson:"count"`
		}
		expenseResult.Decode(&r)
		report.TotalExpense = r.Total
		report.TransactionCount += r.Count
	}

	report.NetBalance = report.TotalIncome - report.TotalExpense

	// Calculate savings rate
	if report.TotalIncome > 0 {
		report.SavingsRate = float64(report.NetBalance) / float64(report.TotalIncome) * 100
	}

	// Get category breakdown (expenses only)
	categoryService := service.NewCategoryService(h.db)
	expenseAggResult, _ := h.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: expenseFilter}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$category_id",
			"total": bson.M{"$sum": "$amount"},
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"total": -1}}},
	})

	var totalExpense int64
	for expenseAggResult.Next(ctx) {
		var r struct {
			ID    primitive.ObjectID `bson:"_id"`
			Total int64              `bson:"total"`
			Count int                `bson:"count"`
		}
		if err := expenseAggResult.Decode(&r); err != nil {
			continue
		}
		totalExpense += r.Total
	}

	expenseAggResult, _ = h.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: expenseFilter}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$category_id",
			"total": bson.M{"$sum": "$amount"},
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"total": -1}}},
	})

	for expenseAggResult.Next(ctx) {
		var r struct {
			ID    primitive.ObjectID `bson:"_id"`
			Total int64              `bson:"total"`
			Count int                `bson:"count"`
		}
		if err := expenseAggResult.Decode(&r); err != nil {
			continue
		}

		category, _ := categoryService.GetByID(ctx, walletID, r.ID)
		categoryName := "Unknown"
		var categoryIcon *string
		var categoryColor *string
		if category != nil {
			categoryName = category.Name
			categoryIcon = category.Icon
			categoryColor = category.Color
		}

		percentage := float64(0)
		if totalExpense > 0 {
			percentage = float64(r.Total) / float64(totalExpense) * 100
		}

		report.Categories = append(report.Categories, CategoryBreakdown{
			CategoryID:       r.ID.Hex(),
			CategoryName:     categoryName,
			CategoryIcon:     categoryIcon,
			CategoryColor:    categoryColor,
			Amount:           r.Total,
			Percentage:       percentage,
			TransactionCount: r.Count,
		})
	}

	// Get top 3 expenses
	if len(report.Categories) > 3 {
		report.TopExpenses = make([]TopExpense, 3)
		for i := 0; i < 3; i++ {
			report.TopExpenses[i] = TopExpense{
				CategoryID:    report.Categories[i].CategoryID,
				CategoryName:  report.Categories[i].CategoryName,
				CategoryIcon:  report.Categories[i].CategoryIcon,
				CategoryColor: report.Categories[i].CategoryColor,
				Amount:        report.Categories[i].Amount,
			}
		}
	} else {
		for _, cat := range report.Categories {
			report.TopExpenses = append(report.TopExpenses, TopExpense{
				CategoryID:    cat.CategoryID,
				CategoryName:  cat.CategoryName,
				CategoryIcon:  cat.CategoryIcon,
				CategoryColor: cat.CategoryColor,
				Amount:        cat.Amount,
			})
		}
	}

	// Get daily totals
	dailyResult, _ := h.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"wallet_id": walletID,
			"date": bson.M{
				"$gte": startDate,
				"$lte": endDate,
			},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":     bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$date"}},
			"income":  bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$type", "income"}}, "$amount", 0}}},
			"expense": bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$type", "expense"}}, "$amount", 0}}},
		}}},
		{{Key: "$sort", Value: bson.M{"_id": 1}}},
	})

	for dailyResult.Next(ctx) {
		var r struct {
			Date    string `bson:"_id"`
			Income  int64  `bson:"income"`
			Expense int64  `bson:"expense"`
		}
		if err := dailyResult.Decode(&r); err != nil {
			continue
		}
		report.DailyTotals = append(report.DailyTotals, DailyTotal{
			Date:    r.Date,
			Income:  r.Income,
			Expense: r.Expense,
		})
	}

	// Get previous month comparison
	prevStartDate := startDate.AddDate(0, -1, 0)
	prevEndDate := startDate.Add(-time.Second)

	prevIncomeFilter := bson.M{
		"wallet_id": walletID,
		"type":      "income",
		"date": bson.M{
			"$gte": prevStartDate,
			"$lte": prevEndDate,
		},
	}
	prevIncomeResult, _ := h.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: prevIncomeFilter}},
		{{Key: "$group", Value: bson.M{"_id": nil, "total": bson.M{"$sum": "$amount"}}}},
	})
	var prevIncome int64
	if prevIncomeResult.Next(ctx) {
		var r struct{ Total int64 }
		prevIncomeResult.Decode(&r)
		prevIncome = r.Total
	}

	prevExpenseFilter := bson.M{
		"wallet_id": walletID,
		"type":      "expense",
		"date": bson.M{
			"$gte": prevStartDate,
			"$lte": prevEndDate,
		},
	}
	prevExpenseResult, _ := h.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: prevExpenseFilter}},
		{{Key: "$group", Value: bson.M{"_id": nil, "total": bson.M{"$sum": "$amount"}}}},
	})
	var prevExpense int64
	if prevExpenseResult.Next(ctx) {
		var r struct{ Total int64 }
		prevExpenseResult.Decode(&r)
		prevExpense = r.Total
	}

	report.PreviousMonthComparison = &MonthComparison{
		IncomeChange:  report.TotalIncome - prevIncome,
		ExpenseChange: report.TotalExpense - prevExpense,
	}

	if prevIncome > 0 {
		report.PreviousMonthComparison.IncomeChangePercent = float64(report.TotalIncome-prevIncome) / float64(prevIncome) * 100
	}
	if prevExpense > 0 {
		report.PreviousMonthComparison.ExpenseChangePercent = float64(report.TotalExpense-prevExpense) / float64(prevExpense) * 100
	}

	return report, nil
}
