package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/fintrack/app/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Database struct {
	Client       *mongo.Client
	Database     *mongo.Database
	Users        *mongo.Collection
	Wallets      *mongo.Collection
	Transactions *mongo.Collection
	Categories   *mongo.Collection
	Budgets      *mongo.Collection
	Recurring    *mongo.Collection
}

func NewDatabase(cfg *config.Config) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.Database.MongoURI))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Test connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	db := client.Database(cfg.Database.DBName)

	database := &Database{
		Client:       client,
		Database:     db,
		Users:        db.Collection("users"),
		Wallets:      db.Collection("wallets"),
		Transactions: db.Collection("transactions"),
		Categories:   db.Collection("categories"),
		Budgets:      db.Collection("budgets"),
		Recurring:    db.Collection("recurring_rules"),
	}

	// Create indexes
	if err := database.createIndexes(ctx); err != nil {
		return nil, fmt.Errorf("failed to create indexes: %w", err)
	}

	return database, nil
}

func (d *Database) createIndexes(ctx context.Context) error {
	// Wallets: unique index on code
	walletCodeIndex := mongo.IndexModel{
		Keys:    map[string]int{"code": 1},
		Options: options.Index().SetUnique(true),
	}
	d.Wallets.Indexes().CreateOne(ctx, walletCodeIndex)

	// Users: unique index on email
	userEmailIndex := mongo.IndexModel{
		Keys:    map[string]int{"email": 1},
		Options: options.Index().SetUnique(true),
	}
	d.Users.Indexes().CreateOne(ctx, userEmailIndex)

	// Transactions: index on wallet_id and date
	transactionIndex := mongo.IndexModel{
		Keys: map[string]int{"wallet_id": 1, "date": -1},
	}
	d.Transactions.Indexes().CreateOne(ctx, transactionIndex)

	// Categories: index on wallet_id
	categoryIndex := mongo.IndexModel{
		Keys: map[string]int{"wallet_id": 1},
	}
	d.Categories.Indexes().CreateOne(ctx, categoryIndex)

	// Budgets: unique index on wallet_id + category_id + month
	budgetIndex := mongo.IndexModel{
		Keys:    map[string]int{"wallet_id": 1, "category_id": 1, "month": 1},
		Options: options.Index().SetUnique(true),
	}
	d.Budgets.Indexes().CreateOne(ctx, budgetIndex)

	return nil
}

func (d *Database) Close() error {
	if d.Client != nil {
		return d.Client.Disconnect(context.Background())
	}
	return nil
}
