package main

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/Sreenesh123/rssagg/internal/database"
	"github.com/google/uuid"
)

func TestNotificationServiceCreation(t *testing.T) {
	var mockDB database.Queries
	
	emailConfig := &EmailConfig{
		Host:      "smtp.gmail.com",
		Port:      587,
		Username:  "test@example.com",
		Password:  "testpassword",
		FromName:  "RSS Aggregator Test",
		FromEmail: "test@example.com",
	}
	
	notificationService := NewNotificationService(mockDB, emailConfig)
	
	if notificationService == nil {
		t.Fatal("Expected notification service to be created, got nil")
	}
	
	if notificationService.emailConfig != emailConfig {
		t.Fatal("Expected email config to be set correctly")
	}
}

func TestEmailConfigValidation(t *testing.T) {
	var mockDB database.Queries
	
	notificationService := NewNotificationService(mockDB, nil)
	
	if notificationService == nil {
		t.Fatal("Expected notification service to be created even with nil email config")
	}
	
	if notificationService.emailConfig != nil {
		t.Fatal("Expected email config to be nil")
	}
}

func TestNotificationTypes(t *testing.T) {
	if NotificationTypeNewPost != "new_post" {
		t.Errorf("Expected NotificationTypeNewPost to be 'new_post', got '%s'", NotificationTypeNewPost)
	}
	
	if NotificationTypeFeedStarred != "feed_starred" {
		t.Errorf("Expected NotificationTypeFeedStarred to be 'feed_starred', got '%s'", NotificationTypeFeedStarred)
	}
}

func TestNotificationStructure(t *testing.T) {
	notification := Notification{
		ID:        uuid.New(),
		UserID:    uuid.New(),
		Type:      NotificationTypeNewPost,
		Message:   "Test notification",
		Read:      false,
		CreatedAt: time.Now(),
		Metadata:  map[string]interface{}{"test": "value"},
	}
	
	if notification.Type != NotificationTypeNewPost {
		t.Error("Notification type not set correctly")
	}
	
	if notification.Read != false {
		t.Error("Notification read status not set correctly")
	}
	
	if notification.Message != "Test notification" {
		t.Error("Notification message not set correctly")
	}
}

func ExampleNotificationService() {
	emailConfig := &EmailConfig{
		Host:      "smtp.gmail.com",
		Port:      587,
		Username:  "your-email@gmail.com",
		Password:  "your-app-password",
		FromName:  "RSS Aggregator",
		FromEmail: "your-email@gmail.com",
	}
	var dbQueries database.Queries
	notificationService := NewNotificationService(dbQueries, emailConfig)
	
	ctx := context.Background()
	notificationService.StartNotificationWorker(ctx)
	notificationService.StartStarredFeedNotificationWorker(ctx)
	
	fmt.Println("Notification service started with background workers")
}
