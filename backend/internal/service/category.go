package service

import (
	"context"
	"errors"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type CategoryService struct {
	db *repository.Database
}

func NewCategoryService(db *repository.Database) *CategoryService {
	return &CategoryService{
		db: db,
	}
}

// GetDefaultCategories returns system default categories
func (s *CategoryService) GetDefaultCategories() []model.Category {
	expenseIcon := "💰"
	expenseColor := "#ef4444"
	incomeIcon := "💵"
	incomeColor := "#22c55e"

	// Pre-defined unique IDs for default categories to ensure consistency
	ids := []primitive.ObjectID{
		mustObjectIDFromHex("650000000000000000000001"),
		mustObjectIDFromHex("650000000000000000000002"),
		mustObjectIDFromHex("650000000000000000000003"),
		mustObjectIDFromHex("650000000000000000000004"),
		mustObjectIDFromHex("650000000000000000000005"),
		mustObjectIDFromHex("650000000000000000000006"),
		mustObjectIDFromHex("650000000000000000000007"),
		mustObjectIDFromHex("650000000000000000000008"),
		mustObjectIDFromHex("650000000000000000000009"),
		mustObjectIDFromHex("65000000000000000000000a"),
		mustObjectIDFromHex("65000000000000000000000b"),
	}

	return []model.Category{
		// Expense categories
		{ID: ids[0], Name: "Makan", Type: "expense", Icon: &expenseIcon, Color: &expenseColor, IsDefault: true},
		{ID: ids[1], Name: "Transport", Type: "expense", Icon: &expenseIcon, Color: &expenseColor, IsDefault: true},
		{ID: ids[2], Name: "Tagihan", Type: "expense", Icon: &expenseIcon, Color: &expenseColor, IsDefault: true},
		{ID: ids[3], Name: "Belanja", Type: "expense", Icon: &expenseIcon, Color: &expenseColor, IsDefault: true},
		{ID: ids[4], Name: "Hiburan", Type: "expense", Icon: &expenseIcon, Color: &expenseColor, IsDefault: true},
		{ID: ids[5], Name: "Kesehatan", Type: "expense", Icon: &expenseIcon, Color: &expenseColor, IsDefault: true},
		{ID: ids[6], Name: "Lainnya", Type: "expense", Icon: &expenseIcon, Color: &expenseColor, IsDefault: true},
		// Income categories
		{ID: ids[7], Name: "Gaji", Type: "income", Icon: &incomeIcon, Color: &incomeColor, IsDefault: true},
		{ID: ids[8], Name: "Freelance", Type: "income", Icon: &incomeIcon, Color: &incomeColor, IsDefault: true},
		{ID: ids[9], Name: "Bonus", Type: "income", Icon: &incomeIcon, Color: &incomeColor, IsDefault: true},
		{ID: ids[10], Name: "Investasi", Type: "income", Icon: &incomeIcon, Color: &incomeColor, IsDefault: true},
	}
}

func mustObjectIDFromHex(s string) primitive.ObjectID {
	id, err := primitive.ObjectIDFromHex(s)
	if err != nil {
		return primitive.NewObjectID()
	}
	return id
}

func (s *CategoryService) GetAll(ctx context.Context, walletID primitive.ObjectID) ([]model.Category, error) {
	// Get default categories with pre-defined unique IDs
	categories := s.GetDefaultCategories()

	// Get custom categories for this wallet
	filter := bson.M{"wallet_id": walletID}
	cursor, err := s.db.Categories.Find(ctx, filter)
	if err != nil {
		return categories, err
	}
	defer cursor.Close(ctx)

	var customCategories []model.Category
	if err := cursor.All(ctx, &customCategories); err != nil {
		return categories, err
	}

	categories = append(categories, customCategories...)
	return categories, nil
}

func (s *CategoryService) GetByID(ctx context.Context, walletID, id primitive.ObjectID) (*model.Category, error) {
	// First check custom categories
	filter := bson.M{
		"_id":       id,
		"wallet_id": walletID,
	}

	var category model.Category
	err := s.db.Categories.FindOne(ctx, filter).Decode(&category)
	if err == nil {
		return &category, nil
	}

	// Check if it's a default category (wallet_id is null or doesn't exist)
	filter = bson.M{"_id": id, "wallet_id": nil}
	err = s.db.Categories.FindOne(ctx, filter).Decode(&category)
	if err == nil {
		return &category, nil
	}

	// Check default categories (in-memory)
	defaultCategories := s.GetDefaultCategories()
	for _, cat := range defaultCategories {
		if cat.ID == id {
			return &cat, nil
		}
	}

	return nil, errors.New("category not found")
}

func (s *CategoryService) Create(ctx context.Context, walletID primitive.ObjectID, req model.CreateCategoryRequest) (*model.Category, error) {
	category := model.Category{
		WalletID:  &walletID,
		Name:      req.Name,
		Type:      model.CategoryType(req.Type),
		IsDefault: false,
	}

	if req.Icon != "" {
		category.Icon = &req.Icon
	}
	if req.Color != "" {
		category.Color = &req.Color
	}

	result, err := s.db.Categories.InsertOne(ctx, category)
	if err != nil {
		return nil, err
	}

	category.ID = result.InsertedID.(primitive.ObjectID)
	return &category, nil
}

func (s *CategoryService) Update(ctx context.Context, walletID, id primitive.ObjectID, req model.CreateCategoryRequest) (*model.Category, error) {
	// Check if category exists and is custom
	filter := bson.M{
		"_id":        id,
		"wallet_id":  walletID,
		"is_default": false,
	}

	var category model.Category
	err := s.db.Categories.FindOne(ctx, filter).Decode(&category)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("category not found or cannot modify default category")
		}
		return nil, err
	}

	// Build update
	update := bson.M{}
	if req.Name != "" {
		update["name"] = req.Name
	}
	if req.Type != "" {
		update["type"] = req.Type
	}
	if req.Icon != "" {
		update["icon"] = req.Icon
	}
	if req.Color != "" {
		update["color"] = req.Color
	}

	if len(update) == 0 {
		return &category, nil
	}

	_, err = s.db.Categories.UpdateOne(ctx, filter, bson.M{"$set": update})
	if err != nil {
		return nil, err
	}

	return s.GetByID(ctx, walletID, id)
}

func (s *CategoryService) Delete(ctx context.Context, walletID, id primitive.ObjectID) error {
	filter := bson.M{
		"_id":        id,
		"wallet_id":  walletID,
		"is_default": false,
	}

	result, err := s.db.Categories.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("category not found or cannot delete default category")
	}

	return nil
}

// SeedDefaultCategories inserts default categories into database for reference
func (s *CategoryService) SeedDefaultCategories(ctx context.Context) error {
	// Check if already seeded
	var existing model.Category
	err := s.db.Categories.FindOne(ctx, bson.M{"name": "Makan", "wallet_id": nil}).Decode(&existing)
	if err == nil {
		return nil // Already seeded
	}

	defaultCategories := s.GetDefaultCategories()

	var models []mongo.WriteModel
	for _, cat := range defaultCategories {
		cat.ID = primitive.NewObjectID()
		models = append(models, mongo.NewInsertOneModel().SetDocument(cat))
	}

	if len(models) == 0 {
		return nil
	}

	_, err = s.db.Categories.BulkWrite(ctx, models)
	return err
}
