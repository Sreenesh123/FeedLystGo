# ML-Based Summarization for RSS Feeds

This document provides details on how to implement the backend service for ML-based summarization of RSS feed content.

## Overview

The RSS client application now includes a feature to summarize post content using machine learning. This feature is accessible through a button on each post that, when clicked, sends the post content to a backend API for summarization.

## API Endpoint Specification

The backend needs to implement the following endpoint:

```
POST /v1/summarize
```

### Request Body

```json
{
  "post_id": "string",       
  "content": "string",        
  "max_length": number,     
  "min_length": number       
}
```

### Response Body

```json
{
  "summary": "string" 
}
```

### Error Response

```json
{
  "error": "string"
}
```

## Implementation Options

### 1. Using OpenAI API

You can integrate with OpenAI's API to generate summaries. Here's a sample implementation:

```go
import (
    "github.com/sashabaranov/go-openai"
)

func generateSummaryWithOpenAI(content string, maxTokens int) (string, error) {
    client := openai.NewClient("your-api-key")

    prompt := "Please summarize the following text concisely:\n\n" + content

    resp, err := client.CreateCompletion(
        context.Background(),
        openai.CompletionRequest{
            Model:       openai.GPT3Dot5Turbo,
            Prompt:      prompt,
            MaxTokens:   maxTokens,
            Temperature: 0.7,
        },
    )
    if err != nil {
        return "", err
    }

    return resp.Choices[0].Text, nil
}
```

### 2. Using Local ML Models

For a self-hosted solution, you can use local ML models:

```go
import (
    "github.com/jdkato/prose/v2"
    "github.com/jdkato/prose/summarize"
)

func generateSummaryLocally(content string, sentenceCount int) (string, error) {
    doc, err := prose.NewDocument(content)
    if err != nil {
        return "", err
    }

    algorithm := summarize.NewLexRank(doc)
    summary := algorithm.Summarize(sentenceCount)

    return summary, nil
}
```

### 3. Using a Third-Party API

There are several third-party APIs you can integrate with:

- [HuggingFace Inference API](https://huggingface.co/inference-api)
- [Cohere](https://cohere.ai/)
- [AI21 Labs](https://www.ai21.com/)

## Configuration

Add these settings to your application configuration:

```go
type Config struct {

    Summarization struct {
        Provider          string  
        APIKey            string  
        DefaultMaxLength  int     
        DefaultMinLength  int     
    }
}
```

## CORS Configuration

Ensure your CORS settings allow requests from your frontend application:

```go
func setupCORS(router *mux.Router) {
    c := cors.New(cors.Options{
        AllowedOrigins:   []string{"http://localhost:5173", "http://172.24.250.71:5173"},
        AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
        AllowedHeaders:   []string{"Content-Type", "Authorization"},
        AllowCredentials: true,
    })

    handler := c.Handler(router)
}
```
