package main

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/Sreenesh123/rssagg/internal/database"
)

type authedHandler func(http.ResponseWriter, *http.Request, database.User)

func (cfg *apiConfig) middlewareAuth(next authedHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondWithError(w, http.StatusUnauthorized, "Missing Authorization header")
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			respondWithError(w, http.StatusUnauthorized, "Malformed token")
			return
		}

		secret := os.Getenv("JWT_SECRET")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			respondWithError(w, http.StatusUnauthorized, "Invalid token")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			respondWithError(w, http.StatusUnauthorized, "Invalid claims")
			return
		}

		userIDStr, ok := claims["user_id"].(string)
		if !ok {
			respondWithError(w, http.StatusUnauthorized, "Invalid user ID in token")
			return
		}
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			respondWithError(w, http.StatusUnauthorized, "Malformed user ID")
			return
		}

		user, err := cfg.DB.GetUserByID(r.Context(), userID)
		if err != nil {
			respondWithError(w, http.StatusUnauthorized, "User not found")
			return
		}

		next(w, r, user)
	}
}
