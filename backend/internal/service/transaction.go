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
	"go.mongodb.org/mongo-driver/mongo/options"
)

type TransactionService struct {
	db *repository.Database
}

func NewTransactionService(db *repository.Database) *TransactionService {
	return &TransactionService{
		db: db,
	}
}

func (s *TransactionService) Create(ctx context.Context, walletID, userID primitive.ObjectID, req model.CreateTransactionRequest) (*model.Transaction, error) {
	// Parse date
	var date time.Time
	var err error
	if req.Date != "" {
		date, err = time.Parse(time.RFC3339, req.Date)
		if err != nil {
			return nil, errors.New("invalid date format")
		}
	} else {
		date = time.Now()
	}

	// Parse category ID
	categoryID, err := primitive.ObjectIDFromHex(req.CategoryID)
	if err != nil {
		return nil, errors.New("invalid category ID")
	}

	transaction := model.Transaction{
		WalletID:     walletID,
		UserID:       userID,
		CategoryID:   categoryID,
		Amount:       req.Amount,
		Type:         model.TransactionType(req.Type),
		Date:         date,
		Note:         &req.Note,
		IsRecurring:  false,
		MerchantName: &req.MerchantName,
		CreatedAt:    time.Now(),
	}

	result, err := s.db.Transactions.InsertOne(ctx, transaction)
	if err != nil {
		return nil, err
	}

	transaction.ID = result.InsertedID.(primitive.ObjectID)
	return &transaction, nil
}

func (s *TransactionService) GetAll(ctx context.Context, walletID primitive.ObjectID, page, limit int, startDate, endDate time.Time, categoryID *string, txType *string) ([]model.Transaction, int64, error) {
	// Build filter
	filter := bson.M{"wallet_id": walletID}

	if !startDate.IsZero() && !endDate.IsZero() {
		filter["date"] = bson.M{
			"$gte": startDate,
			"$lte": endDate,
		}
	}

	if categoryID != nil && *categoryID != "" {
		if oid, err := primitive.ObjectIDFromHex(*categoryID); err == nil {
			filter["category_id"] = oid
		}
	}

	if txType != nil && *txType != "" {
		filter["type"] = *txType
	}

	// Get total count
	total, err := s.db.Transactions.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Set default pagination
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 50
	}

	// Find transactions
	opts := options.Find().
		SetSkip(int64((page - 1) * limit)).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "date", Value: -1}})

	cursor, err := s.db.Transactions.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var transactions []model.Transaction
	if err := cursor.All(ctx, &transactions); err != nil {
		return nil, 0, err
	}

	return transactions, total, nil
}

func (s *TransactionService) GetByID(ctx context.Context, walletID, id primitive.ObjectID) (*model.Transaction, error) {
	filter := bson.M{
		"_id":       id,
		"wallet_id": walletID,
	}

	var transaction model.Transaction
	err := s.db.Transactions.FindOne(ctx, filter).Decode(&transaction)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("transaction not found")
		}
		return nil, err
	}

	return &transaction, nil
}

func (s *TransactionService) Update(ctx context.Context, walletID, id primitive.ObjectID, req model.UpdateTransactionRequest) (*model.Transaction, error) {
	// Get existing transaction
	transaction, err := s.GetByID(ctx, walletID, id)
	if err != nil {
		return nil, err
	}

	// Build update
	update := bson.M{}

	if req.CategoryID != "" {
		if categoryID, err := primitive.ObjectIDFromHex(req.CategoryID); err == nil {
			update["category_id"] = categoryID
		}
	}

	if req.Amount > 0 {
		update["amount"] = req.Amount
	}

	if req.Type != "" {
		update["type"] = model.TransactionType(req.Type)
	}

	if req.Date != "" {
		if date, err := time.Parse(time.RFC3339, req.Date); err == nil {
			update["date"] = date
		}
	}

	// Allow null for note
	update["note"] = req.Note

	if req.MerchantName != "" {
		update["merchant_name"] = req.MerchantName
	}

	if len(update) == 0 {
		return transaction, nil
	}

	_, err = s.db.Transactions.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil {
		return nil, err
	}

	return s.GetByID(ctx, walletID, id)
}

func (s *TransactionService) Delete(ctx context.Context, walletID, id primitive.ObjectID) error {
	filter := bson.M{
		"_id":       id,
		"wallet_id": walletID,
	}

	result, err := s.db.Transactions.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("transaction not found")
	}

	return nil
}

func (s *TransactionService) GetSummary(ctx context.Context, walletID primitive.ObjectID, month string) (*model.DashboardSummary, error) {
	// Parse month (format: "2025-01")
	var startDate, endDate time.Time
	var err error

	if month != "" {
		startDate, err = time.Parse("2006-01", month)
		if err != nil {
			return nil, errors.New("invalid month format")
		}
	} else {
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	}
	endDate = startDate.AddDate(0, 1, 0).Add(-time.Second)

	filter := bson.M{
		"wallet_id": walletID,
		"date": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}

	// Aggregate income
	incomeFilter := bson.M{}
	for k, v := range filter {
		incomeFilter[k] = v
	}
	incomeFilter["type"] = "income"

	incomeResult, err := s.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: incomeFilter}},
		{{Key: "$group", Value: bson.M{"_id": nil, "total": bson.M{"$sum": "$amount"}}}},
	})
	if err != nil {
		return nil, err
	}

	var totalIncome int64
	if incomeResult.Next(ctx) {
		var result struct {
			Total int64 `bson:"total"`
		}
		if err := incomeResult.Decode(&result); err == nil {
			totalIncome = result.Total
		}
	}

	// Aggregate expense
	expenseFilter := bson.M{}
	for k, v := range filter {
		expenseFilter[k] = v
	}
	expenseFilter["type"] = "expense"

	expenseResult, err := s.db.Transactions.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: expenseFilter}},
		{{Key: "$group", Value: bson.M{"_id": nil, "total": bson.M{"$sum": "$amount"}}}},
	})
	if err != nil {
		return nil, err
	}

	var totalExpense int64
	if expenseResult.Next(ctx) {
		var result struct {
			Total int64 `bson:"total"`
		}
		if err := expenseResult.Decode(&result); err == nil {
			totalExpense = result.Total
		}
	}

	return &model.DashboardSummary{
		TotalIncome:  totalIncome,
		TotalExpense: totalExpense,
		NetBalance:   totalIncome - totalExpense,
		Month:        startDate.Format("2006-01"),
	}, nil
}

// GetDB returns the database instance for advanced queries
func (s *TransactionService) GetDB() *repository.Database {
	return s.db
}
