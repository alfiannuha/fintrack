package service

import (
	"context"
	"fmt"
	"time"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type InsightsService struct {
	db *repository.Database
}

func NewInsightsService(db *repository.Database) *InsightsService {
	return &InsightsService{
		db: db,
	}
}

// Insight represents a financial insight
type Insight struct {
	Type      string `json:"type"`       // "warning", "info", "success", "anomaly"
	Title     string `json:"title"`
	Message   string `json:"message"`
	Severity  string `json:"severity"`   // "low", "medium", "high"
	Timestamp string `json:"timestamp"`
}

// GetInsights returns financial insights for the wallet
func (s *InsightsService) GetInsights(ctx context.Context, walletID primitive.ObjectID, month string) ([]Insight, error) {
	var insights []Insight

	// Parse month
	var startDate time.Time
	var err error

	if month != "" {
		startDate, err = time.Parse("2006-01", month)
		if err != nil {
			return nil, err
		}
	} else {
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	}
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	// Get current month stats
	currentStats, err := s.getMonthStats(ctx, walletID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// Get previous month stats
	prevStartDate := startDate.AddDate(0, -1, 0)
	prevEndDate := startDate.Add(-time.Second)
	prevStats, err := s.getMonthStats(ctx, walletID, prevStartDate, prevEndDate)
	if err != nil {
		return nil, err
	}

	// 1. Check if expenses increased significantly
	if prevStats.TotalExpense > 0 {
		increasePercent := float64(currentStats.TotalExpense-prevStats.TotalExpense) / float64(prevStats.TotalExpense) * 100
		if increasePercent > 30 {
			insights = append(insights, Insight{
				Type:      "warning",
				Title:     "Pengeluaran Meningkat",
				Message:   fmt.Sprintf("Pengeluaran bulan ini naik %.0f%% dibanding bulan lalu (%s)", increasePercent, formatCurrency(currentStats.TotalExpense)),
				Severity:  "high",
				Timestamp: time.Now().Format(time.RFC3339),
			})
		}
	}

	// 2. Check if approaching budget limits
	budgetInsights, err := s.getBudgetInsights(ctx, walletID, month)
	if err == nil {
		insights = append(insights, budgetInsights...)
	}

	// 3. Check for unusual spending patterns (anomaly detection)
	anomalies, err := s.detectAnomalies(ctx, walletID, startDate, endDate)
	if err == nil {
		insights = append(insights, anomalies...)
	}

	// 4. Check savings rate
	if currentStats.TotalIncome > 0 {
		savingsRate := float64(currentStats.TotalIncome-currentStats.TotalExpense) / float64(currentStats.TotalIncome) * 100
		if savingsRate >= 20 {
			insights = append(insights, Insight{
				Type:      "success",
				Title:     "Tabungan Bagus!",
				Message:   fmt.Sprintf("Anda menabung %.0f%% dari penghasilan bulan ini", savingsRate),
				Severity:  "low",
				Timestamp: time.Now().Format(time.RFC3339),
			})
		} else if savingsRate < 0 {
			insights = append(insights, Insight{
				Type:      "warning",
				Title:     "Pengeluaran Lebih Besar",
				Message:   "Pengeluaran Anda lebih besar dari pemasukan bulan ini",
				Severity:  "high",
				Timestamp: time.Now().Format(time.RFC3339),
			})
		}
	}

	// 5. Top spending category
	if len(currentStats.TopCategories) > 0 {
		topCat := currentStats.TopCategories[0]
		insights = append(insights, Insight{
			Type:      "info",
			Title:     "Pengeluaran Terbesar",
			Message:   fmt.Sprintf("Kategori %s adalah pengeluaran terbesar (%s)", topCat.Name, formatCurrency(topCat.Amount)),
			Severity:  "low",
			Timestamp: time.Now().Format(time.RFC3339),
		})
	}

	return insights, nil
}

type MonthStats struct {
	TotalIncome  int64
	TotalExpense int64
	TopCategories []CategoryStat
	AvgDailyExpense int64
}

type CategoryStat struct {
	Name   string
	Amount int64
}

func (s *InsightsService) getMonthStats(ctx context.Context, walletID primitive.ObjectID, startDate, endDate time.Time) (*MonthStats, error) {
	filter := bson.M{
		"wallet_id": walletID,
		"date": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}

	// Get income and expense totals
	incomeFilter := bson.M{}
	for k, v := range filter {
		incomeFilter[k] = v
	}
	incomeFilter["type"] = "income"

	expenseFilter := bson.M{}
	for k, v := range filter {
		expenseFilter[k] = v
	}
	expenseFilter["type"] = "expense"

	var totalIncome, totalExpense int64

	// Aggregate income
	incomeResult, _ := s.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: incomeFilter}},
		{{Key: "$group", Value: bson.M{"_id": nil, "total": bson.M{"$sum": "$amount"}}}},
	})
	if incomeResult.Next(ctx) {
		var r struct{ Total int64 }
		incomeResult.Decode(&r)
		totalIncome = r.Total
	}

	// Aggregate expense
	expenseResult, _ := s.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: expenseFilter}},
		{{Key: "$group", Value: bson.M{"_id": nil, "total": bson.M{"$sum": "$amount"}}}},
	})
	if expenseResult.Next(ctx) {
		var r struct{ Total int64 }
		expenseResult.Decode(&r)
		totalExpense = r.Total
	}

	// Get top categories
	categoryResult, _ := s.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: expenseFilter}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "categories",
			"localField":   "category_id",
			"foreignField": "_id",
			"as":           "category",
		}}},
		{{Key: "$unwind", Value: "$category"}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$category._id",
			"name":  bson.M{"$first": "$category.name"},
			"total": bson.M{"$sum": "$amount"},
		}}},
		{{Key: "$sort", Value: bson.M{"total": -1}}},
		{{Key: "$limit", Value: 5}},
	})

	var topCategories []CategoryStat
	for categoryResult.Next(ctx) {
		var r struct {
			Name  string `bson:"name"`
			Total int64  `bson:"total"`
		}
		if err := categoryResult.Decode(&r); err == nil {
			topCategories = append(topCategories, CategoryStat{Name: r.Name, Amount: r.Total})
		}
	}

	// Calculate daily average
	days := endDate.Sub(startDate).Hours() / 24
	avgDaily := int64(0)
	if days > 0 {
		avgDaily = totalExpense / int64(days)
	}

	return &MonthStats{
		TotalIncome:     totalIncome,
		TotalExpense:    totalExpense,
		TopCategories:   topCategories,
		AvgDailyExpense: avgDaily,
	}, nil
}

func (s *InsightsService) getBudgetInsights(ctx context.Context, walletID primitive.ObjectID, month string) ([]Insight, error) {
	var insights []Insight

	if month == "" {
		month = time.Now().Format("2006-01")
	}

	filter := bson.M{"wallet_id": walletID, "month": month}
	cursor, err := s.db.Budgets.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var budget model.Budget
		if err := cursor.Decode(&budget); err != nil {
			continue
		}

		// Calculate spent
		spent, _ := s.calculateSpent(ctx, walletID, budget.CategoryID, month)
		progress := float64(spent) / float64(budget.Amount) * 100

		if progress >= 100 {
			insights = append(insights, Insight{
				Type:      "warning",
				Title:     "Budget Habis",
				Message:   fmt.Sprintf("Budget untuk %s telah habis (%s dari %s)", budget.CategoryID.Hex(), formatCurrency(spent), formatCurrency(budget.Amount)),
				Severity:  "high",
				Timestamp: time.Now().Format(time.RFC3339),
			})
		} else if progress >= 80 {
			insights = append(insights, Insight{
				Type:      "warning",
				Title:     "Budget Menipis",
				Message:   fmt.Sprintf("Budget untuk %s tersisa %.0f%%", budget.CategoryID.Hex(), 100-progress),
				Severity:  "medium",
				Timestamp: time.Now().Format(time.RFC3339),
			})
		}
	}

	return insights, nil
}

func (s *InsightsService) calculateSpent(ctx context.Context, walletID, categoryID primitive.ObjectID, month string) (int64, error) {
	startDate, _ := time.Parse("2006-01", month)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	filter := bson.M{
		"wallet_id":   walletID,
		"category_id": categoryID,
		"type":        "expense",
		"date": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}

	result, err := s.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$group", Value: bson.M{"_id": nil, "total": bson.M{"$sum": "$amount"}}}},
	})
	if err != nil {
		return 0, err
	}

	var total int64
	if result.Next(ctx) {
		var r struct{ Total int64 }
		result.Decode(&r)
		total = r.Total
	}

	return total, nil
}

func (s *InsightsService) detectAnomalies(ctx context.Context, walletID primitive.ObjectID, startDate, endDate time.Time) ([]Insight, error) {
	var anomalies []Insight

	// Calculate average daily expense for this month
	filter := bson.M{
		"wallet_id": walletID,
		"type":      "expense",
		"date": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}

	// Get daily totals
	dailyResult, err := s.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$date"}},
			"total": bson.M{"$sum": "$amount"},
		}}},
	})
	if err != nil {
		return nil, err
	}
	defer dailyResult.Close(ctx)

	type DailyTotal struct {
		Date  string `bson:"_id"`
		Total int64  `bson:"total"`
	}

	var dailyTotals []DailyTotal
	var sum, count int64
	for dailyResult.Next(ctx) {
		var r DailyTotal
		if err := dailyResult.Decode(&r); err == nil {
			dailyTotals = append(dailyTotals, r)
			sum += r.Total
			count++
		}
	}

	if count == 0 {
		return anomalies, nil
	}

	avg := sum / count

	// Calculate standard deviation
	var variance int64
	for _, d := range dailyTotals {
		diff := d.Total - avg
		variance += diff * diff
	}
	stdDev := float64(variance) / float64(count)
	stdDev = float64(int(stdDev * 100)) / 100 // Round to 2 decimals

	// Find anomalies (more than 2 standard deviations from mean)
	threshold := avg + int64(2*float64(avg)) // Simplified: using 200% of average as threshold

	for _, d := range dailyTotals {
		if d.Total > threshold && d.Total > avg*2 {
			anomalies = append(anomalies, Insight{
				Type:      "anomaly",
				Title:     "Pengeluaran Tidak Biasa",
				Message:   fmt.Sprintf("Tanggal %s: %s (rata-rata: %s)", d.Date, formatCurrency(d.Total), formatCurrency(avg)),
				Severity:  "medium",
				Timestamp: time.Now().Format(time.RFC3339),
			})
		}
	}

	return anomalies, nil
}

func formatCurrency(amount int64) string {
	return fmt.Sprintf("Rp %d", amount)
}
