package handler

import (
	"net/http"
	"time"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/service"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type DashboardHandler struct {
	transactionService *service.TransactionService
	categoryService    *service.CategoryService
	budgetService      *service.BudgetService
}

func NewDashboardHandler(
	transactionService *service.TransactionService,
	categoryService *service.CategoryService,
	budgetService *service.BudgetService,
) *DashboardHandler {
	return &DashboardHandler{
		transactionService: transactionService,
		categoryService:    categoryService,
		budgetService:      budgetService,
	}
}

// GetSummary godoc
// @Summary Get dashboard summary
// @Description Get total income, expense, and balance for the month
// @Tags dashboard
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param month query string false "Month (YYYY-MM)"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/dashboard/summary [get]
func (h *DashboardHandler) GetSummary(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	month := c.Query("month")
	summary, err := h.transactionService.GetSummary(c.Request.Context(), walletID, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    summary,
	})
}

// GetDailyChartData godoc
// @Summary Get daily chart data
// @Description Get income and expense data per day for the month
// @Tags dashboard
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param month query string false "Month (YYYY-MM)"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/dashboard/chart/daily [get]
func (h *DashboardHandler) GetDailyChartData(c *gin.Context) {
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

	filter := bson.M{
		"wallet_id": walletID,
		"date": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}

	// Aggregate by date and type
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{
				"date": bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$date"}},
				"type": "$type",
			},
			"total": bson.M{"$sum": "$amount"},
		}}},
		{{Key: "$sort", Value: bson.M{"_id.date": 1}}},
	}

	cursor, err := h.transactionService.GetDB().Transactions.Aggregate(c.Request.Context(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	defer cursor.Close(c.Request.Context())

	// Group results by date
	type Result struct {
		ID struct {
			Date string `bson:"date"`
			Type string `bson:"type"`
		} `bson:"_id"`
		Total int64 `bson:"total"`
	}

	dateMap := make(map[string]*model.DailyChartData)
	for cursor.Next(c.Request.Context()) {
		var result Result
		if err := cursor.Decode(&result); err != nil {
			continue
		}

		date := result.ID.Date
		if _, exists := dateMap[date]; !exists {
			dateMap[date] = &model.DailyChartData{Date: date}
		}

		if result.ID.Type == "income" {
			dateMap[date].Income = result.Total
		} else {
			dateMap[date].Expense = result.Total
		}
	}

	// Convert map to slice
	var chartData []model.DailyChartData
	for _, data := range dateMap {
		chartData = append(chartData, *data)
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    chartData,
	})
}

// GetCategoryChartData godoc
// @Summary Get category chart data
// @Description Get expense breakdown by category for pie chart
// @Tags dashboard
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param month query string false "Month (YYYY-MM)"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/dashboard/chart/category [get]
func (h *DashboardHandler) GetCategoryChartData(c *gin.Context) {
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

	filter := bson.M{
		"wallet_id": walletID,
		"type":      "expense",
		"date": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}

	// Aggregate by category
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$category_id",
			"total": bson.M{"$sum": "$amount"},
		}}},
		{{Key: "$sort", Value: bson.M{"total": -1}}},
	}

	cursor, err := h.transactionService.GetDB().Transactions.Aggregate(c.Request.Context(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	defer cursor.Close(c.Request.Context())

	type Result struct {
		CategoryID primitive.ObjectID `bson:"_id"`
		Total      int64              `bson:"total"`
	}

	var chartData []model.CategoryChartData
	for cursor.Next(c.Request.Context()) {
		var result Result
		if err := cursor.Decode(&result); err != nil {
			continue
		}

		// Get category name
		category, err := h.categoryService.GetByID(c.Request.Context(), walletID, result.CategoryID)
		categoryName := "Unknown"
		color := ""
		if err == nil && category != nil {
			categoryName = category.Name
			if category.Color != nil {
				color = *category.Color
			}
		}

		chartData = append(chartData, model.CategoryChartData{
			Category:   categoryName,
			CategoryID: result.CategoryID.Hex(),
			Amount:     result.Total,
			Color:      color,
		})
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    chartData,
	})
}
