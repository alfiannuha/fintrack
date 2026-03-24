package model

// Auth Requests
type RegisterRequest struct {
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type JoinRequest struct {
	Code     string `json:"code" validate:"required,len=6"`
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// Auth Responses
type AuthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"` // in seconds
}

type AuthResponse struct {
	Success bool       `json:"success"`
	Data    AuthTokens `json:"data"`
	User    User       `json:"user"`
	Wallet  Wallet     `json:"wallet"`
}

// Generic Response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Message *string     `json:"message,omitempty"`
}

type ErrorResponse struct {
	Success bool    `json:"success"`
	Error   string  `json:"error"`
	Message *string `json:"message,omitempty"`
}

// Transaction Requests
type CreateTransactionRequest struct {
	CategoryID   string `json:"category_id" validate:"required"`
	Amount       int64  `json:"amount" validate:"required,gt=0"`
	Type         string `json:"type" validate:"required,oneof=income expense"`
	Date         string `json:"date"` // ISO 8601 format
	Note         string `json:"note"`
	MerchantName string `json:"merchant_name"`
}

type UpdateTransactionRequest struct {
	CategoryID   string `json:"category_id"`
	Amount       int64  `json:"amount"`
	Type         string `json:"type"`
	Date         string `json:"date"`
	Note         string `json:"note"`
	MerchantName string `json:"merchant_name"`
}

// Category Requests
type CreateCategoryRequest struct {
	Name  string `json:"name" validate:"required"`
	Type  string `json:"type" validate:"required,oneof=income expense"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}

// Budget Requests
type CreateBudgetRequest struct {
	CategoryID string `json:"category_id" validate:"required"`
	Amount     int64  `json:"amount" validate:"required,gt=0"`
	Month      string `json:"month"` // Format: "2025-01"
}

// Recurring Requests
type CreateRecurringRequest struct {
	CategoryID string `json:"category_id" validate:"required"`
	Amount     int64  `json:"amount" validate:"required,gt=0"`
	Type       string `json:"type" validate:"required,oneof=income expense"`
	Note       string `json:"note"`
	DayOfMonth int    `json:"day_of_month" validate:"required,min=1,max=31"`
}

// Dashboard Responses
type DashboardSummary struct {
	TotalIncome  int64  `json:"total_income"`
	TotalExpense int64  `json:"total_expense"`
	NetBalance   int64  `json:"net_balance"`
	Month        string `json:"month"`
}

type DailyChartData struct {
	Date    string `json:"date"`
	Income  int64  `json:"income"`
	Expense int64  `json:"expense"`
}

type CategoryChartData struct {
	Category   string `json:"category"`
	CategoryID string `json:"category_id"`
	Amount     int64  `json:"amount"`
	Color      string `json:"color,omitempty"`
}
