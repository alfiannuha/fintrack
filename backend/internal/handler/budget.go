package handler

import (
	"net/http"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/service"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BudgetHandler struct {
	budgetService *service.BudgetService
}

func NewBudgetHandler(budgetService *service.BudgetService) *BudgetHandler {
	return &BudgetHandler{
		budgetService: budgetService,
	}
}

// GetBudgets godoc
// @Summary Get all budgets
// @Description Get list of all budgets with progress
// @Tags budgets
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param month query string false "Month (YYYY-MM)"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/budgets [get]
func (h *BudgetHandler) GetBudgets(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)
	month := c.Query("month")

	budgets, err := h.budgetService.GetAll(c.Request.Context(), walletID, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    budgets,
	})
}

// CreateBudget godoc
// @Summary Create a new budget
// @Description Create a budget for a category
// @Tags budgets
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateBudgetRequest true "Budget data"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/budgets [post]
func (h *BudgetHandler) CreateBudget(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	var req model.CreateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	budget, err := h.budgetService.Create(c.Request.Context(), walletID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    budget,
		Message: ptr("Budget created successfully"),
	})
}

// UpdateBudget godoc
// @Summary Update budget
// @Description Update an existing budget
// @Tags budgets
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Budget ID"
// @Param request body model.CreateBudgetRequest true "Budget data"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/budgets/:id [put]
func (h *BudgetHandler) UpdateBudget(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid budget ID",
		})
		return
	}

	var req model.CreateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	budget, err := h.budgetService.Update(c.Request.Context(), walletID, id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    budget,
		Message: ptr("Budget updated successfully"),
	})
}

// DeleteBudget godoc
// @Summary Delete budget
// @Description Delete a budget
// @Tags budgets
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Budget ID"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/budgets/:id [delete]
func (h *BudgetHandler) DeleteBudget(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid budget ID",
		})
		return
	}

	err = h.budgetService.Delete(c.Request.Context(), walletID, id)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Message: ptr("Budget deleted successfully"),
	})
}
