package service

import (
	"context"
	"errors"
	"time"

	"github.com/fintrack/app/internal/model"
	"github.com/fintrack/app/internal/repository"
	"github.com/fintrack/app/pkg/invitation"
	"github.com/fintrack/app/pkg/jwt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	db         *repository.Database
	jwtManager *jwt.JWTManager
}

func NewAuthService(db *repository.Database, jwtManager *jwt.JWTManager) *AuthService {
	return &AuthService{
		db:         db,
		jwtManager: jwtManager,
	}
}

func (s *AuthService) Register(ctx context.Context, req model.RegisterRequest) (*model.AuthResponse, error) {
	// Check if email already exists
	var existingUser model.User
	err := s.db.Users.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		return nil, errors.New("email already registered")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Generate unique wallet code
	var walletCode string
	for i := 0; i < 10; i++ {
		walletCode = invitation.GenerateCode()

		// Check if code already exists
		var existingWallet model.Wallet
		err := s.db.Wallets.FindOne(ctx, bson.M{"code": walletCode}).Decode(&existingWallet)
		if err != nil {
			// Code is unique
			break
		}
		if i == 9 {
			return nil, errors.New("failed to generate unique wallet code")
		}
	}

	now := time.Now()
	walletID := primitive.NewObjectID()
	userID := primitive.NewObjectID()

	// Create wallet
	wallet := model.Wallet{
		ID:        walletID,
		Code:      walletCode,
		Name:      req.Name,
		CreatedBy: userID,
		Members:   []primitive.ObjectID{userID},
		CreatedAt: now,
	}

	// Create user
	user := model.User{
		ID:           userID,
		WalletID:     walletID,
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		CreatedAt:    now,
	}

	// Insert both in a transaction
	session, err := s.db.Client.StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sessionContext mongo.SessionContext) (interface{}, error) {
		if _, err := s.db.Wallets.InsertOne(sessionContext, wallet); err != nil {
			return nil, err
		}
		if _, err := s.db.Users.InsertOne(sessionContext, user); err != nil {
			return nil, err
		}
		return nil, nil
	})

	if err != nil {
		return nil, err
	}

	// Generate tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(userID, walletID, req.Email)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(userID)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Success: true,
		Data: model.AuthTokens{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    900, // 15 minutes in seconds
		},
		User:   user,
		Wallet: wallet,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req model.LoginRequest) (*model.AuthResponse, error) {
	var user model.User
	err := s.db.Users.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Get wallet
	var wallet model.Wallet
	err = s.db.Wallets.FindOne(ctx, bson.M{"_id": user.WalletID}).Decode(&wallet)
	if err != nil {
		return nil, errors.New("wallet not found")
	}

	// Generate tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, wallet.ID, user.Email)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Success: true,
		Data: model.AuthTokens{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    900,
		},
		User:   user,
		Wallet: wallet,
	}, nil
}

func (s *AuthService) Join(ctx context.Context, req model.JoinRequest) (*model.AuthResponse, error) {
	// Find wallet by code
	var wallet model.Wallet
	err := s.db.Wallets.FindOne(ctx, bson.M{"code": req.Code}).Decode(&wallet)
	if err != nil {
		return nil, errors.New("invalid invitation code")
	}

	// Check if email already exists
	var existingUser model.User
	err = s.db.Users.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		return nil, errors.New("email already registered")
	}

	// Hash password from request
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	userID := primitive.NewObjectID()

	// Create user
	user := model.User{
		ID:           userID,
		WalletID:     wallet.ID,
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		CreatedAt:    now,
	}

	// Update wallet members
	_, err = s.db.Wallets.UpdateOne(
		ctx,
		bson.M{"_id": wallet.ID},
		bson.M{"$push": bson.M{"members": userID}},
	)
	if err != nil {
		return nil, err
	}

	// Insert user
	if _, err := s.db.Users.InsertOne(ctx, user); err != nil {
		return nil, err
	}

	// Generate tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(userID, wallet.ID, req.Email)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(userID)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Success: true,
		Data: model.AuthTokens{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    900,
		},
		User:   user,
		Wallet: wallet,
	}, nil
}
