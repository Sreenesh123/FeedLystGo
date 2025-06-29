
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
)

type StarredFeed struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	FeedID    string    `json:"feed_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type StarredFeedRequest struct {
	FeedID string `json:"feed_id"`
}

func CreateStarredFeedHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(User)
	var req StarredFeedRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	
	if req.FeedID == "" {
		http.Error(w, "Feed ID is required", http.StatusBadRequest)
		return
	}
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM feeds WHERE id = $1)", req.FeedID).Scan(&exists)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if !exists {
		http.Error(w, "Feed not found", http.StatusNotFound)
		return
	}
	
	var starredFeedID string
	err = db.QueryRow("SELECT id FROM starred_feeds WHERE user_id = $1 AND feed_id = $2", 
		user.ID, req.FeedID).Scan(&starredFeedID)
		
	if err != nil && err != sql.ErrNoRows {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	
	if err == nil {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	starredFeed := StarredFeed{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		FeedID:    req.FeedID,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
	
	_, err = db.Exec(`
		INSERT INTO starred_feeds (id, user_id, feed_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`, starredFeed.ID, starredFeed.UserID, starredFeed.FeedID, starredFeed.CreatedAt, starredFeed.UpdatedAt)
	
	if err != nil {
		http.Error(w, "Failed to star feed", http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(starredFeed)
}

func GetStarredFeedsHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(User)
	
	rows, err := db.Query(`
		SELECT f.*
		FROM feeds f
		JOIN starred_feeds sf ON f.id = sf.feed_id
		WHERE sf.user_id = $1
	`, user.ID)
	
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	var feeds []Feed
	for rows.Next() {
		var feed Feed
		if err := rows.Scan(
			&feed.ID, 
			&feed.Name, 
			&feed.URL, 
			&feed.UserID,
			&feed.CreatedAt, 
			&feed.UpdatedAt,
		); err != nil {
			http.Error(w, "Error reading feeds", http.StatusInternalServerError)
			return
		}
		feeds = append(feeds, feed)
	}
	
	if err := rows.Err(); err != nil {
		http.Error(w, "Error reading feeds", http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(feeds)
}

func DeleteStarredFeedHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(User)
	
	feedID := chi.URLParam(r, "feedID")
	
	result, err := db.Exec(
		"DELETE FROM starred_feeds WHERE user_id = $1 AND feed_id = $2",
		user.ID, feedID,
	)
	
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	
	if rowsAffected == 0 {
		http.Error(w, "Feed was not starred", http.StatusNotFound)
		return
	}
	
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Feed unstarred successfully",
	})
}

