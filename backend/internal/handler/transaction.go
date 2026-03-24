package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/service"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TransactionHandler struct {
	transactionService *service.TransactionService
}

func NewTransactionHandler(transactionService *service.TransactionService) *TransactionHandler {
	return &TransactionHandler{
		transactionService: transactionService,
	}
}

// CreateTransaction godoc
// @Summary Create a new transaction
// @Description Create a new income or expense transaction
// @Tags transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateTransactionRequest true "Transaction data"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/transactions [post]
func (h *TransactionHandler) Create(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)
	userID := c.MustGet("user_id").(primitive.ObjectID)

	var req model.CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	transaction, err := h.transactionService.Create(c.Request.Context(), walletID, userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    transaction,
		Message: ptr("Transaction created successfully"),
	})
}

// GetTransactions godoc
// @Summary Get all transactions
// @Description Get list of transactions with filters
// @Tags transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(50)
// @Param start_date query string false "Start date (ISO 8601)"
// @Param end_date query string false "End date (ISO 8601)"
// @Param category_id query string false "Category ID"
// @Param type query string false "Transaction type" Enums(income, expense)
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/transactions [get]
func (h *TransactionHandler) GetTransactions(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	// Parse query params
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	var startDate, endDate time.Time
	if c.Query("start_date") != "" {
		startDate, _ = time.Parse(time.RFC3339, c.Query("start_date"))
	}
	if c.Query("end_date") != "" {
		endDate, _ = time.Parse(time.RFC3339, c.Query("end_date"))
	}

	var categoryID *string
	if c.Query("category_id") != "" {
		catID := c.Query("category_id")
		categoryID = &catID
	}

	var txType *string
	if c.Query("type") != "" {
		t := c.Query("type")
		txType = &t
	}

	transactions, total, err := h.transactionService.GetAll(c.Request.Context(), walletID, page, limit, startDate, endDate, categoryID, txType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data: gin.H{
			"transactions": transactions,
			"total":        total,
			"page":         page,
			"limit":        limit,
		},
	})
}

// GetTransaction godoc
// @Summary Get transaction by ID
// @Description Get detail of a transaction
// @Tags transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transaction ID"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/transactions/:id [get]
func (h *TransactionHandler) GetTransaction(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid transaction ID",
		})
		return
	}

	transaction, err := h.transactionService.GetByID(c.Request.Context(), walletID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    transaction,
	})
}

// UpdateTransaction godoc
// @Summary Update transaction
// @Description Update an existing transaction
// @Tags transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transaction ID"
// @Param request body model.UpdateTransactionRequest true "Transaction data"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/transactions/:id [put]
func (h *TransactionHandler) UpdateTransaction(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid transaction ID",
		})
		return
	}

	var req model.UpdateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	transaction, err := h.transactionService.Update(c.Request.Context(), walletID, id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    transaction,
		Message: ptr("Transaction updated successfully"),
	})
}

// DeleteTransaction godoc
// @Summary Delete transaction
// @Description Delete a transaction
// @Tags transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transaction ID"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/transactions/:id [delete]
func (h *TransactionHandler) DeleteTransaction(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid transaction ID",
		})
		return
	}

	err = h.transactionService.Delete(c.Request.Context(), walletID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Message: ptr("Transaction deleted successfully"),
	})
}

func ptr[T any](v T) *T {
	return &v
}
