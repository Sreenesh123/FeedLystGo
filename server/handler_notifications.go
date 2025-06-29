package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Sreenesh123/rssagg/internal/database"
)

type NotificationSettings struct {
	EnableStarredFeedNotifications bool      `json:"enable_starred_feed_notifications"`
	EnableEmailNotifications       bool      `json:"enable_email_notifications"`
	NotificationFrequency          string    `json:"notification_frequency"` // "immediate", "hourly", "daily"
	UpdatedAt                      time.Time `json:"updated_at"`
}

func (apiCfg *apiConfig) GetNotificationSettingsHandler(w http.ResponseWriter, r *http.Request, user database.User) {
	settings := NotificationSettings{
		EnableStarredFeedNotifications: true,
		EnableEmailNotifications:       false,
		NotificationFrequency:          "immediate",
		UpdatedAt:                      time.Now().UTC(),
	}
	
	respondWithJSON(w, http.StatusOK, settings)
}

type UpdateNotificationSettingsRequest struct {
	EnableStarredFeedNotifications *bool   `json:"enable_starred_feed_notifications,omitempty"`
	EnableEmailNotifications       *bool   `json:"enable_email_notifications,omitempty"`
	NotificationFrequency          *string `json:"notification_frequency,omitempty"` // "immediate", "hourly", "daily"
}

func (apiCfg *apiConfig) UpdateNotificationSettingsHandler(w http.ResponseWriter, r *http.Request, user database.User) {
	var req UpdateNotificationSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if req.NotificationFrequency != nil {
		freq := *req.NotificationFrequency
		if freq != "immediate" && freq != "hourly" && freq != "daily" {
			respondWithError(w, http.StatusBadRequest, "Invalid notification frequency. Must be 'immediate', 'hourly', or 'daily'")
			return
		}
	}
	
	settings := NotificationSettings{
		EnableStarredFeedNotifications: true,
		EnableEmailNotifications:       false,
		NotificationFrequency:          "immediate",
		UpdatedAt:                      time.Now().UTC(),
	}
	
	if req.EnableStarredFeedNotifications != nil {
		settings.EnableStarredFeedNotifications = *req.EnableStarredFeedNotifications
	}
	if req.EnableEmailNotifications != nil {
		settings.EnableEmailNotifications = *req.EnableEmailNotifications
	}
	if req.NotificationFrequency != nil {
		settings.NotificationFrequency = *req.NotificationFrequency
	}
	
	respondWithJSON(w, http.StatusOK, settings)
}
