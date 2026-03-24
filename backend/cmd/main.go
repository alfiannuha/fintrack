package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fintrack/app/config"
	"github.com/fintrack/app/internal/handler"
	"github.com/fintrack/app/internal/middleware"
	"github.com/fintrack/app/internal/repository"
	"github.com/fintrack/app/internal/service"
	"github.com/fintrack/app/pkg/jwt"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// @title FinTrack API
// @version 1.0
// @description FinTrack PWA Backend API
// @host localhost:8080
// @BasePath /api/v1
func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	// Load configuration
	cfg := config.Load()

	// Validate configuration
	if err := cfg.Validate(); err != nil {
		log.Fatalf("Configuration error: %v", err)
	}

	// Initialize database
	db, err := repository.NewDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize JWT manager
	jwtManager := jwt.NewJWTManager(cfg.JWT.Secret, cfg.JWT.AccessExp, cfg.JWT.RefreshExp)

	// Initialize services
	authService := service.NewAuthService(db, jwtManager)
	transactionService := service.NewTransactionService(db)
	categoryService := service.NewCategoryService(db)
	budgetService := service.NewBudgetService(db)
	recurringService := service.NewRecurringService(db, transactionService)
	// autoCategoryService := service.NewAutoCategoryService(db) // For future use
	insightsService := service.NewInsightsService(db)

	// Seed default categories
	if err := categoryService.SeedDefaultCategories(context.Background()); err != nil {
		log.Printf("Warning: Failed to seed default categories: %v", err)
	}

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	transactionHandler := handler.NewTransactionHandler(transactionService, db)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	budgetHandler := handler.NewBudgetHandler(budgetService, db)
	dashboardHandler := handler.NewDashboardHandler(transactionService, categoryService, budgetService)
	recurringHandler := handler.NewRecurringHandler(recurringService)
	insightsHandler := handler.NewInsightsHandler(insightsService)

	// Setup Gin router
	r := gin.Default()

	// Apply CORS middleware
	r.Use(middleware.CORSMiddleware(cfg.CORS.AllowedOrigins))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})
	r.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Public routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/join", authHandler.Join)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(jwtManager))
		{
			// Dashboard
			dashboard := protected.Group("/dashboard")
			{
				dashboard.GET("/summary", dashboardHandler.GetSummary)
				dashboard.GET("/chart/daily", dashboardHandler.GetDailyChartData)
				dashboard.GET("/chart/category", dashboardHandler.GetCategoryChartData)
			}

			// Transactions
			transactions := protected.Group("/transactions")
			{
				transactions.GET("", transactionHandler.GetTransactions)
				transactions.POST("", transactionHandler.Create)
				transactions.GET("/:id", transactionHandler.GetTransaction)
				transactions.PUT("/:id", transactionHandler.UpdateTransaction)
				transactions.DELETE("/:id", transactionHandler.DeleteTransaction)
			}

			// Categories
			categories := protected.Group("/categories")
			{
				categories.GET("", categoryHandler.GetCategories)
				categories.POST("", categoryHandler.CreateCategory)
				categories.PUT("/:id", categoryHandler.UpdateCategory)
				categories.DELETE("/:id", categoryHandler.DeleteCategory)
			}

			// Budgets
			budgets := protected.Group("/budgets")
			{
				budgets.GET("", budgetHandler.GetBudgets)
				budgets.POST("", budgetHandler.CreateBudget)
				budgets.PUT("/:id", budgetHandler.UpdateBudget)
				budgets.DELETE("/:id", budgetHandler.DeleteBudget)
			}

			// Recurring
			recurring := protected.Group("/recurring")
			{
				recurring.GET("", recurringHandler.GetRecurring)
				recurring.POST("", recurringHandler.CreateRecurring)
				recurring.PUT("/:id", recurringHandler.UpdateRecurring)
				recurring.DELETE("/:id", recurringHandler.DeleteRecurring)
				recurring.PUT("/:id/toggle", recurringHandler.ToggleRecurring)
			}

			// Insights
			insights := protected.Group("/insights")
			{
				insights.GET("", insightsHandler.GetInsights)
			}

			// Auto-category (for suggestions)
			// To be implemented

			// Wallet
			// wallet := protected.Group("/wallet")
			// {
			// 	// Wallet endpoints to be implemented
			// }

			// User
			// user := protected.Group("/user")
			// {
			// 	// User endpoints to be implemented
			// }
		}
	}

	// Start recurring transaction cron job
	go func() {
		log.Println("Starting recurring transaction cron job...")
		ticker := time.NewTicker(24 * time.Hour) // Run every 24 hours
		defer ticker.Stop()

		for range ticker.C {
			ctx := context.Background()
			count, err := recurringService.ProcessRecurringTransactions(ctx)
			if err != nil {
				log.Printf("Error processing recurring transactions: %v", err)
			} else {
				log.Printf("Processed %d recurring transactions", count)
			}
		}
	}()

	// Create server
	srv := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: r,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Starting server on port %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server stopped")
}
