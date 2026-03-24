package service

import (
	"context"
	"strings"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AutoCategoryService struct {
	db *repository.Database
}

func NewAutoCategoryService(db *repository.Database) *AutoCategoryService {
	return &AutoCategoryService{
		db: db,
	}
}

// KeywordMapping represents a mapping from keyword to category
type KeywordMapping struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	WalletID   primitive.ObjectID `bson:"wallet_id"`
	Keyword    string             `bson:"keyword"`
	CategoryID primitive.ObjectID `bson:"category_id"`
	CategoryName string           `bson:"category_name"`
}

// GetDefaultMappings returns system default keyword mappings
func (s *AutoCategoryService) GetDefaultMappings() []map[string]string {
	return []map[string]string{
		// Food & Dining
		{"keyword": "mcdonald", "category": "Makan", "type": "expense"},
		{"keyword": "starbucks", "category": "Makan", "type": "expense"},
		{"keyword": "grabfood", "category": "Makan", "type": "expense"},
		{"keyword": "gofood", "category": "Makan", "type": "expense"},
		{"keyword": "restaurant", "category": "Makan", "type": "expense"},
		{"keyword": "cafe", "category": "Makan", "type": "expense"},
		
		// Transportation
		{"keyword": "grab", "category": "Transport", "type": "expense"},
		{"keyword": "gojek", "category": "Transport", "type": "expense"},
		{"keyword": "uber", "category": "Transport", "type": "expense"},
		{"keyword": "taxi", "category": "Transport", "type": "expense"},
		{"keyword": "shell", "category": "Transport", "type": "expense"},
		{"keyword": "pertamina", "category": "Transport", "type": "expense"},
		{"keyword": "parkir", "category": "Transport", "type": "expense"},
		
		// Bills & Utilities
		{"keyword": "pln", "category": "Tagihan", "type": "expense"},
		{"keyword": "listrik", "category": "Tagihan", "type": "expense"},
		{"keyword": "pdam", "category": "Tagihan", "type": "expense"},
		{"keyword": "air", "category": "Tagihan", "type": "expense"},
		{"keyword": "internet", "category": "Tagihan", "type": "expense"},
		{"keyword": "telkom", "category": "Tagihan", "type": "expense"},
		{"keyword": "indihome", "category": "Tagihan", "type": "expense"},
		
		// Shopping
		{"keyword": "shopee", "category": "Belanja", "type": "expense"},
		{"keyword": "tokopedia", "category": "Belanja", "type": "expense"},
		{"keyword": "lazada", "category": "Belanja", "type": "expense"},
		{"keyword": "blibli", "category": "Belanja", "type": "expense"},
		{"keyword": "carrefour", "category": "Belanja", "type": "expense"},
		{"keyword": "hypermart", "category": "Belanja", "type": "expense"},
		
		// Entertainment
		{"keyword": "netflix", "category": "Hiburan", "type": "expense"},
		{"keyword": "spotify", "category": "Hiburan", "type": "expense"},
		{"keyword": "cinema", "category": "Hiburan", "type": "expense"},
		{"keyword": "bioskop", "category": "Hiburan", "type": "expense"},
		
		// Health
		{"keyword": "apotek", "category": "Kesehatan", "type": "expense"},
		{"keyword": "pharmacy", "category": "Kesehatan", "type": "expense"},
		{"keyword": "hospital", "category": "Kesehatan", "type": "expense"},
		{"keyword": "rs ", "category": "Kesehatan", "type": "expense"},
		{"keyword": "klinik", "category": "Kesehatan", "type": "expense"},
		
		// Income
		{"keyword": "gaji", "category": "Gaji", "type": "income"},
		{"keyword": "salary", "category": "Gaji", "type": "income"},
		{"keyword": "bonus", "category": "Bonus", "type": "income"},
		{"keyword": "freelance", "category": "Freelance", "type": "income"},
		{"keyword": "project", "category": "Freelance", "type": "income"},
	}
}

// SuggestCategory suggests a category based on merchant name or note
func (s *AutoCategoryService) SuggestCategory(ctx context.Context, walletID primitive.ObjectID, merchantName, note, txType string) (*model.Category, error) {
	searchText := strings.ToLower(merchantName + " " + note)

	// First, check custom mappings for this wallet
	customMapping, err := s.findCustomMapping(ctx, walletID, searchText)
	if err == nil && customMapping != nil {
		return &model.Category{
			ID:        customMapping.CategoryID,
			Name:      customMapping.CategoryName,
			Type:      model.CategoryType(txType),
			IsDefault: false,
		}, nil
	}

	// Then check default mappings
	defaultMapping := s.findDefaultMapping(searchText, txType)
	if defaultMapping != nil {
		return &model.Category{
			Name:      defaultMapping["category"],
			Type:      model.CategoryType(txType),
			IsDefault: true,
		}, nil
	}

	return nil, nil
}

func (s *AutoCategoryService) findCustomMapping(ctx context.Context, walletID primitive.ObjectID, searchText string) (*KeywordMapping, error) {
	filter := bson.M{
		"wallet_id": walletID,
		"keyword":   bson.M{"$regex": searchText, "$options": "i"},
	}

	var mapping KeywordMapping
	err := s.db.Categories.FindOne(ctx, filter).Decode(&mapping)
	if err != nil {
		return nil, err
	}

	return &mapping, nil
}

func (s *AutoCategoryService) findDefaultMapping(searchText, txType string) map[string]string {
	for _, mapping := range s.GetDefaultMappings() {
		if mapping["type"] != txType {
			continue
		}

		if strings.Contains(searchText, strings.ToLower(mapping["keyword"])) {
			return mapping
		}
	}

	return nil
}

// GetMappings returns all keyword mappings for a wallet
func (s *AutoCategoryService) GetMappings(ctx context.Context, walletID primitive.ObjectID) ([]KeywordMapping, error) {
	filter := bson.M{"wallet_id": walletID}

	cursor, err := s.db.Categories.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var mappings []KeywordMapping
	if err := cursor.All(ctx, &mappings); err != nil {
		return nil, err
	}

	return mappings, nil
}

// AddMapping creates a new keyword mapping
func (s *AutoCategoryService) AddMapping(ctx context.Context, walletID primitive.ObjectID, keyword string, categoryID primitive.ObjectID, categoryName string) error {
	mapping := KeywordMapping{
		WalletID:     walletID,
		Keyword:      strings.ToLower(keyword),
		CategoryID:   categoryID,
		CategoryName: categoryName,
	}

	_, err := s.db.Categories.InsertOne(ctx, mapping)
	return err
}

// RemoveMapping deletes a keyword mapping
func (s *AutoCategoryService) RemoveMapping(ctx context.Context, walletID primitive.ObjectID, keyword string) error {
	filter := bson.M{
		"wallet_id": walletID,
		"keyword":   strings.ToLower(keyword),
	}

	_, err := s.db.Categories.DeleteOne(ctx, filter)
	return err
}
