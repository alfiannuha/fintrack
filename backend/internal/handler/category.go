package handler

import (
	"net/http"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/service"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CategoryHandler struct {
	categoryService *service.CategoryService
}

func NewCategoryHandler(categoryService *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{
		categoryService: categoryService,
	}
}

// GetCategories godoc
// @Summary Get all categories
// @Description Get list of all categories (default + custom)
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/categories [get]
func (h *CategoryHandler) GetCategories(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	categories, err := h.categoryService.GetAll(c.Request.Context(), walletID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    categories,
	})
}

// CreateCategory godoc
// @Summary Create a new category
// @Description Create a custom category
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateCategoryRequest true "Category data"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/categories [post]
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	var req model.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	category, err := h.categoryService.Create(c.Request.Context(), walletID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    category,
		Message: ptr("Category created successfully"),
	})
}

// UpdateCategory godoc
// @Summary Update category
// @Description Update a custom category
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Category ID"
// @Param request body model.CreateCategoryRequest true "Category data"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/categories/:id [put]
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid category ID",
		})
		return
	}

	var req model.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	category, err := h.categoryService.Update(c.Request.Context(), walletID, id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    category,
		Message: ptr("Category updated successfully"),
	})
}

// DeleteCategory godoc
// @Summary Delete category
// @Description Delete a custom category
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Category ID"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/categories/:id [delete]
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid category ID",
		})
		return
	}

	err = h.categoryService.Delete(c.Request.Context(), walletID, id)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Message: ptr("Category deleted successfully"),
	})
}
