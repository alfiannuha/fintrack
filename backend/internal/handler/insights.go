package handler

import (
	"net/http"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/service"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type InsightsHandler struct {
	insightsService *service.InsightsService
}

func NewInsightsHandler(insightsService *service.InsightsService) *InsightsHandler {
	return &InsightsHandler{
		insightsService: insightsService,
	}
}

// GetInsights godoc
// @Summary Get financial insights
// @Description Get AI-powered financial insights and anomaly detection
// @Tags insights
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param month query string false "Month (YYYY-MM)"
// @Success 200 {object} model.SuccessResponse
// @Router /api/v1/insights [get]
func (h *InsightsHandler) GetInsights(c *gin.Context) {
	walletID := c.MustGet("wallet_id").(primitive.ObjectID)
	month := c.Query("month")

	insights, err := h.insightsService.GetInsights(c.Request.Context(), walletID, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    insights,
	})
}
