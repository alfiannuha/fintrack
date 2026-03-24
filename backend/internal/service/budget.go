package service

import (
	"context"
	"errors"
	"time"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type BudgetService struct {
	db *repository.Database
}

func NewBudgetService(db *repository.Database) *BudgetService {
	return &BudgetService{
		db: db,
	}
}

func (s *BudgetService) GetAll(ctx context.Context, walletID primitive.ObjectID, month string) ([]model.Budget, error) {
	// Default to current month
	if month == "" {
		now := time.Now()
		month = now.Format("2006-01")
	}

	filter := bson.M{
		"wallet_id": walletID,
		"month":     month,
	}

	cursor, err := s.db.Budgets.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var budgets []model.Budget
	if err := cursor.All(ctx, &budgets); err != nil {
		return nil, err
	}

	// Calculate spent amount for each budget
	for i := range budgets {
		spent, err := s.calculateSpent(ctx, walletID, budgets[i].CategoryID, month)
		if err == nil {
			budgets[i].Spent = &spent
			progress := float64(spent) / float64(budgets[i].Amount) * 100
			budgets[i].Progress = &progress
		}
	}

	return budgets, nil
}

func (s *BudgetService) calculateSpent(ctx context.Context, walletID, categoryID primitive.ObjectID, month string) (int64, error) {
	startDate, err := time.Parse("2006-01", month)
	if err != nil {
		return 0, err
	}
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
		var r struct {
			Total int64 `bson:"total"`
		}
		if err := result.Decode(&r); err == nil {
			total = r.Total
		}
	}

	return total, nil
}

func (s *BudgetService) GetByID(ctx context.Context, walletID, id primitive.ObjectID) (*model.Budget, error) {
	filter := bson.M{
		"_id":       id,
		"wallet_id": walletID,
	}

	var budget model.Budget
	err := s.db.Budgets.FindOne(ctx, filter).Decode(&budget)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("budget not found")
		}
		return nil, err
	}

	return &budget, nil
}

func (s *BudgetService) Create(ctx context.Context, walletID primitive.ObjectID, req model.CreateBudgetRequest) (*model.Budget, error) {
	// Parse category ID
	categoryID, err := primitive.ObjectIDFromHex(req.CategoryID)
	if err != nil {
		return nil, errors.New("invalid category ID")
	}

	// Default to current month
	month := req.Month
	if month == "" {
		month = time.Now().Format("2006-01")
	}

	// Check if budget already exists for this category and month
	filter := bson.M{
		"wallet_id":   walletID,
		"category_id": categoryID,
		"month":       month,
	}

	var existing model.Budget
	err = s.db.Budgets.FindOne(ctx, filter).Decode(&existing)
	if err == nil {
		return nil, errors.New("budget already exists for this category and month")
	}

	budget := model.Budget{
		WalletID:   walletID,
		CategoryID: categoryID,
		Amount:     req.Amount,
		Period:     "monthly",
		Month:      month,
	}

	result, err := s.db.Budgets.InsertOne(ctx, budget)
	if err != nil {
		return nil, err
	}

	budget.ID = result.InsertedID.(primitive.ObjectID)
	return &budget, nil
}

func (s *BudgetService) Update(ctx context.Context, walletID, id primitive.ObjectID, req model.CreateBudgetRequest) (*model.Budget, error) {
	budget, err := s.GetByID(ctx, walletID, id)
	if err != nil {
		return nil, err
	}

	update := bson.M{}

	if req.Amount > 0 {
		update["amount"] = req.Amount
	}

	if req.CategoryID != "" {
		if categoryID, err := primitive.ObjectIDFromHex(req.CategoryID); err == nil {
			update["category_id"] = categoryID
		}
	}

	if len(update) == 0 {
		return budget, nil
	}

	_, err = s.db.Budgets.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil {
		return nil, err
	}

	return s.GetByID(ctx, walletID, id)
}

func (s *BudgetService) Delete(ctx context.Context, walletID, id primitive.ObjectID) error {
	filter := bson.M{
		"_id":       id,
		"wallet_id": walletID,
	}

	result, err := s.db.Budgets.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("budget not found")
	}

	return nil
}
