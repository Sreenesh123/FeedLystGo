package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/Sreenesh123/rssagg/internal/database"
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

type HuggingFaceRequest struct {
	Inputs     string `json:"inputs"`
	Parameters struct {
		MaxLength int `json:"max_length"`
		MinLength int `json:"min_length"`
	} `json:"parameters"`
	Options struct {
		WaitForModel bool `json:"wait_for_model"`
	} `json:"options"`
}

type HuggingFaceResponse []struct {
	SummaryText string `json:"summary_text"`
}

func (cfg *apiConfig) handlerSummarize(w http.ResponseWriter, r *http.Request, user database.User) {
	var req SummarizeRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Content == "" {
		respondWithError(w, http.StatusBadRequest, "Content is required")
		return
	}
	if req.MaxLength <= 0 {
		req.MaxLength = 150
	}
	if req.MinLength <= 0 {
		req.MinLength = 50
	}
	huggingFaceAPIKey := os.Getenv("HUGGINGFACE_API_KEY")
	if huggingFaceAPIKey == "" {
		respondWithError(w, http.StatusInternalServerError, "Summarization service is not configured")
		return
	}
	apiRequest := HuggingFaceRequest{
		Inputs: req.Content,
	}
	apiRequest.Parameters.MaxLength = req.MaxLength
	apiRequest.Parameters.MinLength = req.MinLength
	apiRequest.Options.WaitForModel = true
	jsonData, err := json.Marshal(apiRequest)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to prepare summarization request")
		return
	}
	hfURL := "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
	httpReq, err := http.NewRequest("POST", hfURL, bytes.NewBuffer(jsonData))
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create summarization request")
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+huggingFaceAPIKey)
	httpReq.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to communicate with summarization service")
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		respondWithError(w, http.StatusInternalServerError, "Summarization service responded with an error: "+string(body))
		return
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to read summarization response")
		return
	}
	var hfResp HuggingFaceResponse
	err = json.Unmarshal(body, &hfResp)
	
	var summary string
	
	if err == nil && len(hfResp) > 0 && hfResp[0].SummaryText != "" {
		summary = hfResp[0].SummaryText
	} else {
		var singleResp struct {
			SummaryText string `json:"summary_text"`
		}
		
		err = json.Unmarshal(body, &singleResp)
		if err != nil || singleResp.SummaryText == "" {
			summary = string(body)
			if len(summary) > 1000 || (summary[0] == '{' || summary[0] == '[') {
				respondWithError(w, http.StatusInternalServerError, "Failed to parse summarization response")
				return
			}
		} else {
			summary = singleResp.SummaryText
		}
	}
	
	summary = strings.TrimSpace(summary)
	
	if summary == "" {
		respondWithError(w, http.StatusInternalServerError, "No summary generated")
		return
	}

	result := SummarizeResponse{
		Summary: summary,
	}
	respondWithJSON(w, http.StatusOK, result)
}
