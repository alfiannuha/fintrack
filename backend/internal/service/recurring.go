package service

import (
	"context"
	"time"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type RecurringService struct {
	db                 *repository.Database
	transactionService *TransactionService
}

func NewRecurringService(db *repository.Database, transactionService *TransactionService) *RecurringService {
	return &RecurringService{
		db:                 db,
		transactionService: transactionService,
	}
}

func (s *RecurringService) GetAll(ctx context.Context, walletID primitive.ObjectID) ([]model.RecurringRule, error) {
	filter := bson.M{"wallet_id": walletID}

	cursor, err := s.db.Recurring.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var rules []model.RecurringRule
	if err := cursor.All(ctx, &rules); err != nil {
		return nil, err
	}

	return rules, nil
}

func (s *RecurringService) GetByID(ctx context.Context, walletID, id primitive.ObjectID) (*model.RecurringRule, error) {
	filter := bson.M{
		"_id":       id,
		"wallet_id": walletID,
	}

	var rule model.RecurringRule
	err := s.db.Recurring.FindOne(ctx, filter).Decode(&rule)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &rule, nil
}

func (s *RecurringService) Create(ctx context.Context, walletID, userID primitive.ObjectID, req model.CreateRecurringRequest) (*model.RecurringRule, error) {
	categoryID, err := primitive.ObjectIDFromHex(req.CategoryID)
	if err != nil {
		return nil, err
	}

	rule := model.RecurringRule{
		WalletID:   walletID,
		CategoryID: categoryID,
		Amount:     req.Amount,
		Type:       model.TransactionType(req.Type),
		Note:       &req.Note,
		DayOfMonth: req.DayOfMonth,
		IsActive:   true,
	}

	result, err := s.db.Recurring.InsertOne(ctx, rule)
	if err != nil {
		return nil, err
	}

	rule.ID = result.InsertedID.(primitive.ObjectID)
	return &rule, nil
}

func (s *RecurringService) Update(ctx context.Context, walletID, id primitive.ObjectID, req model.CreateRecurringRequest) (*model.RecurringRule, error) {
	rule, err := s.GetByID(ctx, walletID, id)
	if err != nil {
		return nil, err
	}

	if rule == nil {
		return nil, mongo.ErrNoDocuments
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

	if req.Type != "" {
		update["type"] = req.Type
	}

	if req.Note != "" {
		update["note"] = req.Note
	}

	if req.DayOfMonth >= 1 && req.DayOfMonth <= 31 {
		update["day_of_month"] = req.DayOfMonth
	}

	if len(update) == 0 {
		return rule, nil
	}

	_, err = s.db.Recurring.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil {
		return nil, err
	}

	return s.GetByID(ctx, walletID, id)
}

func (s *RecurringService) ToggleActive(ctx context.Context, walletID, id primitive.ObjectID) (*model.RecurringRule, error) {
	rule, err := s.GetByID(ctx, walletID, id)
	if err != nil {
		return nil, err
	}

	if rule == nil {
		return nil, mongo.ErrNoDocuments
	}

	_, err = s.db.Recurring.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"is_active": !rule.IsActive}},
	)
	if err != nil {
		return nil, err
	}

	return s.GetByID(ctx, walletID, id)
}

func (s *RecurringService) Delete(ctx context.Context, walletID, id primitive.ObjectID) error {
	filter := bson.M{
		"_id":       id,
		"wallet_id": walletID,
	}

	result, err := s.db.Recurring.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return mongo.ErrNoDocuments
	}

	return nil
}

// ProcessRecurringTransactions runs daily to create transactions from active rules
func (s *RecurringService) ProcessRecurringTransactions(ctx context.Context) (int, error) {
	today := time.Now()
	currentDay := today.Day()

	// Find all active rules that should run today
	filter := bson.M{
		"is_active":    true,
		"day_of_month": currentDay,
	}

	cursor, err := s.db.Recurring.Find(ctx, filter)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var rules []model.RecurringRule
	if err := cursor.All(ctx, &rules); err != nil {
		return 0, err
	}

	createdCount := 0

	for _, rule := range rules {
		// Check if already processed today
		var existingTx model.Transaction
		startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)

		err := s.db.Transactions.FindOne(ctx, bson.M{
			"wallet_id":    rule.WalletID,
			"category_id":  rule.CategoryID,
			"amount":       rule.Amount,
			"is_recurring": true,
			"date": bson.M{
				"$gte": startOfDay,
				"$lte": endOfDay,
			},
		}).Decode(&existingTx)

		if err == nil {
			// Already processed today, skip
			continue
		}

		// Create transaction from rule
		note := "Recurring transaction"
		if rule.Note != nil {
			note = *rule.Note
		}

		tx := model.Transaction{
			WalletID:    rule.WalletID,
			UserID:      rule.WalletID, // Use wallet ID as placeholder, will be updated
			CategoryID:  rule.CategoryID,
			Amount:      rule.Amount,
			Type:        rule.Type,
			Date:        time.Now(),
			Note:        &note,
			IsRecurring: true,
			CreatedAt:   time.Now(),
		}

		_, err = s.db.Transactions.InsertOne(ctx, tx)
		if err != nil {
			continue
		}

		// Update rule's last_run_at
		_, err = s.db.Recurring.UpdateOne(
			ctx,
			bson.M{"_id": rule.ID},
			bson.M{"$set": bson.M{"last_run_at": time.Now()}},
		)
		if err != nil {
			continue
		}

		createdCount++
	}

	return createdCount, nil
}

// GetStats returns statistics about recurring rules
func (s *RecurringService) GetStats(ctx context.Context, walletID primitive.ObjectID) (map[string]interface{}, error) {
	// Count active and inactive rules
	activeCount, _ := s.db.Recurring.CountDocuments(ctx, bson.M{"wallet_id": walletID, "is_active": true})
	inactiveCount, _ := s.db.Recurring.CountDocuments(ctx, bson.M{"wallet_id": walletID, "is_active": false})

	// Calculate total monthly amount
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"wallet_id": walletID, "is_active": true}}},
		{{Key: "$group", Value: bson.M{"_id": "$type", "total": bson.M{"$sum": "$amount"}}}},
	}

	cursor, err := s.db.Recurring.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	type Result struct {
		Type  string `bson:"_id"`
		Total int64  `bson:"total"`
	}

	stats := map[string]interface{}{
		"active_rules":   activeCount,
		"inactive_rules": inactiveCount,
		"monthly_income": int64(0),
		"monthly_expense": int64(0),
	}

	for cursor.Next(ctx) {
		var result Result
		if err := cursor.Decode(&result); err != nil {
			continue
		}

		if result.Type == "income" {
			stats["monthly_income"] = result.Total
		} else {
			stats["monthly_expense"] = result.Total
		}
	}

	return stats, nil
}
