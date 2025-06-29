
package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
)

type SummarizeRequest struct {
	PostID    string `json:"post_id"`
	Content   string `json:"content"`
	MaxLength int    `json:"max_length"`
	MinLength int    `json:"min_length"`
}

type SummarizeResponse struct {
	Summary string `json:"summary"`
}

func SummarizeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SummarizeRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if req.Content == "" {
		http.Error(w, "Content is required", http.StatusBadRequest)
		return
	}

	if req.MaxLength <= 0 {
		req.MaxLength = 150
	}
	if req.MinLength <= 0 {
		req.MinLength = 50
	}

	summary := generateMockSummary(req.Content, req.MaxLength, req.MinLength)

	resp := SummarizeResponse{
		Summary: summary,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func generateMockSummary(content string, maxLength, minLength int) string {
	words := strings.Fields(content)
	if len(words) <= minLength/5 {
		return content
	}

	summary := strings.Join(words[:min(len(words), maxLength/5)], " ")
	return summary + "..."
}
