package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Claims struct {
	UserID   primitive.ObjectID `json:"user_id"`
	WalletID primitive.ObjectID `json:"wallet_id"`
	Email    string             `json:"email"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	secretKey  string
	accessExp  time.Duration
	refreshExp time.Duration
}

func NewJWTManager(secretKey string, accessExpMinutes, refreshExpDays int) *JWTManager {
	return &JWTManager{
		secretKey:  secretKey,
		accessExp:  time.Duration(accessExpMinutes) * time.Minute,
		refreshExp: time.Duration(refreshExpDays) * 24 * time.Hour,
	}
}

func (m *JWTManager) GenerateAccessToken(userID, walletID primitive.ObjectID, email string) (string, error) {
	claims := Claims{
		UserID:   userID,
		WalletID: walletID,
		Email:    email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.accessExp)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.secretKey))
}

func (m *JWTManager) GenerateRefreshToken(userID primitive.ObjectID) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID.Hex(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.refreshExp)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.secretKey))
}

func (m *JWTManager) ValidateAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(m.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func (m *JWTManager) ValidateRefreshToken(tokenString string) (string, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(m.secretKey), nil
	})

	if err != nil {
		return "", err
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return "", errors.New("invalid token")
	}

	return claims.Subject, nil
}
