package main

import (
	"net/http"
	"strconv"

	"github.com/Sreenesh123/rssagg/internal/database"
	"github.com/google/uuid"
)

func (apiCfg *apiConfig) handlerGetPosts(w http.ResponseWriter, r *http.Request, user database.User) {
	feedIDStr := r.URL.Query().Get("feed_id")
	
	if feedIDStr != "" {
		feedID, err := uuid.Parse(feedIDStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid feed ID format")
			return
		}
		
		limitStr := r.URL.Query().Get("limit")
		limit := 10
		if limitStr != "" {
			parsedLimit, err := strconv.Atoi(limitStr)
			if err == nil && parsedLimit > 0 {
				limit = parsedLimit
			}
		}
		
		offsetStr := r.URL.Query().Get("offset")
		offset := 0
		if offsetStr != "" {
			parsedOffset, err := strconv.Atoi(offsetStr)
			if err == nil && parsedOffset >= 0 {
				offset = parsedOffset
			}
		}
		
		posts, err := apiCfg.DB.GetPostsByFeedID(r.Context(), database.GetPostsByFeedIDParams{
			FeedID: feedID,
			Limit:  int32(limit),
			Offset: int32(offset),
		})
		
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "Couldn't get posts")
			return
		}
		
		respondWithJSON(w, http.StatusOK, databasePostsToPosts(posts))
		return
	}
	
	limit := 10
	limitStr := r.URL.Query().Get("limit")
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}
	
	posts, err := apiCfg.DB.GetPostsForUser(r.Context(), database.GetPostsForUserParams{
		UserID: user.ID,
		Limit:  int32(limit),
	})
	
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't get posts")
		return
	}
	
	respondWithJSON(w, http.StatusOK, databasePostsToPosts(posts))
}
