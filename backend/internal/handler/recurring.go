package handler

import (
	"net/http"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/service"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RecurringHandler struct {
	recurringService *service.RecurringService
}

func NewRecurringHandler(recurringService *service.RecurringService) *RecurringHandler {
	return &RecurringHandler{
		recurringService: recurringService,
	}
}

// GetRecurring godoc
// @Summary Get all recurring rules
// @Description Get list of all recurring transaction rules
// @Tags recurring
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/recurring [get]
func (h *RecurringHandler) GetRecurring(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	rules, err := h.recurringService.GetAll(c.Request.Context(), walletID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    rules,
	})
}

// CreateRecurring godoc
// @Summary Create a new recurring rule
// @Description Create a new recurring transaction rule
// @Tags recurring
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateRecurringRequest true "Recurring rule data"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/recurring [post]
func (h *RecurringHandler) CreateRecurring(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)
	userID := c.MustGet("user_id").(primitive.ObjectID)

	var req model.CreateRecurringRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	rule, err := h.recurringService.Create(c.Request.Context(), walletID, userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    rule,
		Message: ptr("Recurring rule created successfully"),
	})
}

// ToggleRecurring godoc
// @Summary Toggle recurring rule active status
// @Description Toggle active/inactive status of a recurring rule
// @Tags recurring
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Recurring Rule ID"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/recurring/:id/toggle [put]
func (h *RecurringHandler) ToggleRecurring(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid rule ID",
		})
		return
	}

	rule, err := h.recurringService.ToggleActive(c.Request.Context(), walletID, id)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    rule,
		Message: ptr("Recurring rule toggled successfully"),
	})
}

// UpdateRecurring godoc
// @Summary Update recurring rule
// @Description Update an existing recurring rule
// @Tags recurring
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Recurring Rule ID"
// @Param request body model.CreateRecurringRequest true "Recurring rule data"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/recurring/:id [put]
func (h *RecurringHandler) UpdateRecurring(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid rule ID",
		})
		return
	}

	var req model.CreateRecurringRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	rule, err := h.recurringService.Update(c.Request.Context(), walletID, id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    rule,
		Message: ptr("Recurring rule updated successfully"),
	})
}

// DeleteRecurring godoc
// @Summary Delete recurring rule
// @Description Delete a recurring rule
// @Tags recurring
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Recurring Rule ID"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/recurring/:id [delete]
func (h *RecurringHandler) DeleteRecurring(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid rule ID",
		})
		return
	}

	err = h.recurringService.Delete(c.Request.Context(), walletID, id)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Message: ptr("Recurring rule deleted successfully"),
	})
}
