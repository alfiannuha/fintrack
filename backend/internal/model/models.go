package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	WalletID     primitive.ObjectID `bson:"wallet_id" json:"wallet_id"`
	Name         string             `bson:"name" json:"name"`
	Email        string             `bson:"email" json:"email"`
	PasswordHash string             `bson:"password_hash" json:"-"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
}

type Wallet struct {
	ID        primitive.ObjectID   `bson:"_id,omitempty" json:"_id,omitempty"`
	Code      string               `bson:"code" json:"code"`
	Name      string               `bson:"name" json:"name"`
	CreatedBy primitive.ObjectID   `bson:"created_by" json:"created_by"`
	Members   []primitive.ObjectID `bson:"members" json:"members"`
	CreatedAt time.Time            `bson:"created_at" json:"created_at"`
}

type TransactionType string

const (
	TransactionTypeIncome  TransactionType = "income"
	TransactionTypeExpense TransactionType = "expense"
)

type Transaction struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	WalletID     primitive.ObjectID `bson:"wallet_id" json:"wallet_id"`
	UserID       primitive.ObjectID `bson:"user_id" json:"user_id"`
	CategoryID   primitive.ObjectID `bson:"category_id" json:"category_id"`
	Category     *Category          `bson:"category,omitempty" json:"category,omitempty"`
	Amount       int64              `bson:"amount" json:"amount"` // In Rupiah (no decimals)
	Type         TransactionType    `bson:"type" json:"type"`
	Date         time.Time          `bson:"date" json:"date"`
	Note         *string            `bson:"note,omitempty" json:"note,omitempty"`
	IsRecurring  bool               `bson:"is_recurring" json:"is_recurring"`
	MerchantName *string            `bson:"merchant_name,omitempty" json:"merchant_name,omitempty"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
}

type CategoryType string

const (
	CategoryTypeIncome  CategoryType = "income"
	CategoryTypeExpense CategoryType = "expense"
)

type Category struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty" json:"_id,omitempty"`
	WalletID  *primitive.ObjectID `bson:"wallet_id,omitempty" json:"wallet_id,omitempty"`
	Name      string              `bson:"name" json:"name"`
	Type      CategoryType        `bson:"type" json:"type"`
	Icon      *string             `bson:"icon,omitempty" json:"icon,omitempty"`
	Color     *string             `bson:"color,omitempty" json:"color,omitempty"`
	IsDefault bool                `bson:"is_default" json:"is_default"`
}

type BudgetPeriod string

const (
	BudgetPeriodMonthly BudgetPeriod = "monthly"
)

type Budget struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	WalletID   primitive.ObjectID `bson:"wallet_id" json:"wallet_id"`
	CategoryID primitive.ObjectID `bson:"category_id" json:"category_id"`
	Category   *Category          `bson:"category,omitempty" json:"category,omitempty"`
	Amount     int64              `bson:"amount" json:"amount"`
	Period     BudgetPeriod       `bson:"period" json:"period"`
	Month      string             `bson:"month" json:"month"` // Format: "2025-01"
	// Computed fields (not stored in DB)
	Spent    *int64   `bson:"-" json:"spent,omitempty"`
	Progress *float64 `bson:"-" json:"progress,omitempty"`
}

type RecurringRule struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	WalletID   primitive.ObjectID `bson:"wallet_id" json:"wallet_id"`
	CategoryID primitive.ObjectID `bson:"category_id" json:"category_id"`
	Amount     int64              `bson:"amount" json:"amount"`
	Type       TransactionType    `bson:"type" json:"type"`
	Note       *string            `bson:"note,omitempty" json:"note,omitempty"`
	DayOfMonth int                `bson:"day_of_month" json:"day_of_month"`
	IsActive   bool               `bson:"is_active" json:"is_active"`
	LastRunAt  *time.Time         `bson:"last_run_at,omitempty" json:"last_run_at,omitempty"`
}
