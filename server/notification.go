package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/Sreenesh123/rssagg/internal/database"
	"github.com/google/uuid"
	"gopkg.in/gomail.v2"
)

type NotificationType string

const (
	NotificationTypeNewPost NotificationType = "new_post"
	NotificationTypeFeedStarred NotificationType = "feed_starred"
)
type EmailConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	FromName string
	FromEmail string
}
type Notification struct {
	ID        uuid.UUID       `json:"id"`
	UserID    uuid.UUID       `json:"user_id"`
	Type      NotificationType `json:"type"`
	Message   string          `json:"message"`
	Read      bool            `json:"read"`
	CreatedAt time.Time       `json:"created_at"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}
type NotificationService struct {
	db database.Queries
	emailConfig *EmailConfig
}
func NewNotificationService(db database.Queries, emailConfig *EmailConfig) *NotificationService {
	return &NotificationService{
		db: db,
		emailConfig: emailConfig,
	}
}
func (ns *NotificationService) createNotification(
	ctx context.Context,
	userID uuid.UUID, 
	notificationType NotificationType, 
	message string,
	metadata map[string]interface{},
) error {
	notificationID := uuid.New()
	if len(metadata) > 0 {
		log.Printf("Notification metadata: %v", metadata)
	}
	log.Printf("Would save notification ID %s to database for user %s, type: %s", 
		notificationID, userID, notificationType)
	
	log.Printf("Created notification for user %s: %s", userID, message)
	user, err := ns.db.GetUserByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user for notification: %w", err)
	}
	if user.Email.Valid && user.Email.String != "" {
		var subject, emailBody string
		
		switch notificationType {
		case NotificationTypeNewPost:
			var postTitle, feedName string
			if metadata != nil {
				if title, ok := metadata["post_title"].(string); ok {
					postTitle = title
				}
				if name, ok := metadata["feed_name"].(string); ok {
					feedName = name
				}
			}
			
			subject = fmt.Sprintf("New Post in %s", feedName)
			emailBody = fmt.Sprintf(`
				<h2>New Post Available</h2>
				<p>A new post titled <strong>%s</strong> is available in the feed <strong>%s</strong> that you follow.</p>
				<p>Message: %s</p>
				<hr>
				<p><small>This is an automated notification from your RSS aggregator.</small></p>
			`, postTitle, feedName, message)
			
		case NotificationTypeFeedStarred:
			subject = "Feed Starred Confirmation"
			emailBody = fmt.Sprintf(`
				<h2>Feed Starred</h2>
				<p>%s</p>
				<p>You will now receive notifications when new posts are available in this feed.</p>
				<hr>
				<p><small>This is an automated notification from your RSS aggregator.</small></p>
			`, message)
			
		default:
			subject = "RSS Aggregator Notification"
			emailBody = fmt.Sprintf(`
				<h2>Notification</h2>
				<p>%s</p>
				<hr>
				<p><small>This is an automated notification from your RSS aggregator.</small></p>
			`, message)
		}
		if err := ns.sendEmail(user.Email.String, subject, emailBody); err != nil {
			log.Printf("Failed to send email notification: %v", err)
		}
	}
	return nil
}

func (ns *NotificationService) SendFeedStarredNotification(
	ctx context.Context,
	user database.User,
	feedID uuid.UUID,
	feedName string,
) error {
	message := fmt.Sprintf("You have starred the feed: %s", feedName)
	
	metadata := map[string]interface{}{
		"feed_id": feedID.String(),
		"feed_name": feedName,
	}
	
	return ns.createNotification(ctx, user.ID, NotificationTypeFeedStarred, message, metadata)
}
func (ns *NotificationService) SendNewPostNotification(
	ctx context.Context,
	post database.Post,
	feed database.Feed,
) error {
	log.Printf("Sending notifications to users who starred feed %s about new post: %s", 
		feed.ID, post.Title)
	
	starredUsers, err := ns.db.GetUsersStarringFeed(ctx, feed.ID)
	if err != nil {
		return fmt.Errorf("failed to get users who starred feed: %w", err)
	}
	
	if len(starredUsers) == 0 {
		log.Printf("No users have starred feed %s, skipping notifications", feed.ID)
		return nil
	}
	
	log.Printf("Found %d users who have starred feed %s", len(starredUsers), feed.ID)
	
	for _, user := range starredUsers {
		message := fmt.Sprintf("New post: %s", post.Title)
		metadata := map[string]interface{}{
			"post_id": post.ID.String(),
			"post_title": post.Title,
			"feed_id": feed.ID.String(),
			"feed_name": feed.Name,
			"post_url": post.Url,
		}
		
		if err := ns.createNotification(ctx, user.ID, NotificationTypeNewPost, message, metadata); err != nil {
			log.Printf("Error sending notification to user %s: %v", user.ID, err)
		}
	}
	
	return nil
}

func (ns *NotificationService) StartNotificationWorker(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(15 * time.Minute) 
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				if err := ns.checkForNewPostsAndNotify(ctx); err != nil {
					log.Printf("Error checking for new posts: %v", err)
				}
			case <-ctx.Done():
				log.Println("Notification worker shutting down")
				return
			}
		}
	}()
	
	log.Println("Notification worker started")
}

func (ns *NotificationService) checkForNewPostsAndNotify(ctx context.Context) error {
	
	log.Println("Checking for new posts to notify users about")
	return nil
}

func (ns *NotificationService) CheckForNewPostsInStarredFeeds(ctx context.Context) error {
	log.Println("Checking for new posts in starred feeds...")
	feeds, err := ns.db.GetFeeds(ctx)
	if err != nil {
		return fmt.Errorf("error fetching feeds: %w", err)
	}
	
	_ = time.Now().Add(-1 * time.Hour) 
	for _, feed := range feeds {
		log.Printf("Checking feed %s (%s) for new content", feed.Name, feed.ID)
	}
	
	log.Println("Finished checking for new posts in starred feeds")
	
	return nil
}

func (ns *NotificationService) StartStarredFeedNotificationWorker(ctx context.Context) {
	go func() {
		time.Sleep(1 * time.Minute)
		if err := ns.CheckForNewPostsInStarredFeeds(ctx); err != nil {
			log.Printf("Error checking for new posts: %v", err)
		}
		ticker := time.NewTicker(15 * time.Minute)
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				if err := ns.CheckForNewPostsInStarredFeeds(ctx); err != nil {
					log.Printf("Error checking for new posts: %v", err)
				}
			case <-ctx.Done():
				log.Println("Starred feed notification worker shutting down")
				return
			}
		}
	}()
	
	log.Println("Starred feed notification worker started")
}
func (ns *NotificationService) sendEmail(
	to string,
	subject string,
	body string,
) error {
	if ns.emailConfig == nil {
		log.Printf("Email would be sent to %s with subject: %s", to, subject)
		return nil
	}

	m := gomail.NewMessage()
	m.SetHeader("From", fmt.Sprintf("%s <%s>", ns.emailConfig.FromName, ns.emailConfig.FromEmail))
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer(ns.emailConfig.Host, ns.emailConfig.Port, ns.emailConfig.Username, ns.emailConfig.Password)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("Email sent successfully to %s", to)
	return nil
}
