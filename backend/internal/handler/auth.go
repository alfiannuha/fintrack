package handler

import (
	"net/http"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/service"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Register godoc
// @Summary Register a new user
// @Description Register a new user and create a new wallet
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.RegisterRequest true "Register request"
// @Success 200 {object} model.AuthResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	response, err := h.authService.Register(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// Login godoc
// @Summary Login user
// @Description Login with email and password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.LoginRequest true "Login request"
// @Success 200 {object} model.AuthResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	response, err := h.authService.Login(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// Join godoc
// @Summary Join existing wallet
// @Description Join an existing wallet using invitation code
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.JoinRequest true "Join request"
// @Success 200 {object} model.AuthResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/auth/join [post]
func (h *AuthHandler) Join(c *gin.Context) {
	var req model.JoinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	response, err := h.authService.Join(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}
