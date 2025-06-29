package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/Sreenesh123/rssagg/internal/database"
	"github.com/go-chi/chi"
	"github.com/google/uuid"
)
type StarredFeed struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	FeedID    uuid.UUID `json:"feed_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
type StarredFeedRequest struct {
	FeedID string `json:"feed_id"`
}
func databaseStarredFeedToStarredFeed(starredFeed database.StarredFeed) StarredFeed {
	return StarredFeed{
		ID:        starredFeed.ID,
		UserID:    starredFeed.UserID,
		FeedID:    starredFeed.FeedID,
		CreatedAt: starredFeed.CreatedAt,
		UpdatedAt: starredFeed.UpdatedAt,
	}
}
func databaseCreateStarredFeedRowToStarredFeed(starredFeed database.CreateStarredFeedRow) StarredFeed {
	return StarredFeed{
		ID:        starredFeed.ID,
		UserID:    starredFeed.UserID,
		FeedID:    starredFeed.FeedID,
		CreatedAt: starredFeed.CreatedAt,
		UpdatedAt: starredFeed.UpdatedAt,
	}
}
func (apiCfg *apiConfig) CreateStarredFeedHandler(w http.ResponseWriter, r *http.Request, user database.User) {
	var req StarredFeedRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	feedID, err := uuid.Parse(req.FeedID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid feed ID format")
		return
	}
	isStarred, err := apiCfg.DB.CheckFeedIsStarred(r.Context(), database.CheckFeedIsStarredParams{
		UserID: user.ID,
		FeedID: feedID,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if isStarred {
		respondWithJSON(w, http.StatusOK, map[string]string{
			"message": "Feed is already starred",
		})
		return
	}
	starredFeed, err := apiCfg.DB.CreateStarredFeed(r.Context(), database.CreateStarredFeedParams{
		ID:        uuid.New(),
		UserID:    user.ID,
		FeedID:    feedID,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to star feed")
		return
	}
	go sendFeedStarredNotification(user, feedID)
	if apiCfg.NotificationService != nil {
		go func() {
			ctx := context.Background()
			feedName := "Feed"
			apiCfg.NotificationService.SendFeedStarredNotification(ctx, user, feedID, feedName)
		}()
	}

	respondWithJSON(w, http.StatusCreated, databaseCreateStarredFeedRowToStarredFeed(starredFeed))
}

func (apiCfg *apiConfig) GetStarredFeedsHandler(w http.ResponseWriter, r *http.Request, user database.User) {

	feeds, err := apiCfg.DB.GetStarredFeedsForUser(r.Context(), user.ID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error")
		return
	}

	respondWithJSON(w, http.StatusOK, databaseFeedsToFeeds(feeds))
}

func (apiCfg *apiConfig) handleDeleteStarredFeed(w http.ResponseWriter, r *http.Request, user database.User) {
	feedID := chi.URLParam(r, "feedID")
	feedIDUUID, err := uuid.Parse(feedID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid feed ID format")
		return
	}
	err = apiCfg.DB.DeleteStarredFeed(r.Context(), database.DeleteStarredFeedParams{
		UserID: user.ID,
		FeedID: feedIDUUID,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error")
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Feed unstarred successfully",
	})
}
func sendFeedStarredNotification(user database.User, feedID uuid.UUID) {
	fmt.Printf("Sending notification to user %s for starred feed %s\n", user.ID.String(), feedID.String())
}

type RecentPostsFromStarredFeedsRequest struct {
	Since string `json:"since"` 
}
func (apiCfg *apiConfig) GetRecentPostsFromStarredFeedsHandler(w http.ResponseWriter, r *http.Request, user database.User) {
	var since time.Time
	sinceParam := r.URL.Query().Get("since")
	
	if sinceParam != "" {
		var err error
		since, err = time.Parse(time.RFC3339, sinceParam)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid 'since' parameter. Use ISO-8601 format (YYYY-MM-DDTHH:MM:SSZ).")
			return
		}
	} else {
		since = time.Now().Add(-24 * time.Hour)
	}
	
	starredFeeds, err := apiCfg.DB.GetStarredFeedsForUser(r.Context(), user.ID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch starred feeds")
		return
	}
	
	if len(starredFeeds) == 0 {
		respondWithJSON(w, http.StatusOK, []Post{})
		return
	}

	
	dbPosts, err := apiCfg.DB.GetPostsForUser(r.Context(), database.GetPostsForUserParams{
		UserID: user.ID,
		Limit:  100, 
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}
	var allPosts []Post
	for _, dbPost := range dbPosts {
		post := databasePostToPost(dbPost)
		var postTime time.Time
		if post.PublishedAt != nil {
			postTime = *post.PublishedAt
		} else {
			postTime = post.CreatedAt
		}
		
		if postTime.After(since) {
			allPosts = append(allPosts, post)
		}
	}
	respondWithJSON(w, http.StatusOK, allPosts)
}