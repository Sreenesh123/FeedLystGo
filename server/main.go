package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"github.com/Sreenesh123/rssagg/internal/database"

	_ "github.com/lib/pq"
)

type apiConfig struct {
	DB *database.Queries
    NotificationService *NotificationService
}

func main() {
	godotenv.Load(".env")

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("PORT environment variable is not set")
	}


	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal(err)
	}
	dbQueries := database.New(db)
    
    emailConfig := &EmailConfig{
        Host:      os.Getenv("EMAIL_HOST"),
        Username:  os.Getenv("EMAIL_USERNAME"),
        Password:  os.Getenv("EMAIL_PASSWORD"),
        FromName:  os.Getenv("EMAIL_FROM_NAME"),
        FromEmail: os.Getenv("EMAIL_FROM_ADDRESS"),
    }
    
    emailPortStr := os.Getenv("EMAIL_PORT")
    if emailPortStr != "" {
        if port, err := strconv.Atoi(emailPortStr); err == nil {
            emailConfig.Port = port
        } else {
            log.Printf("Invalid EMAIL_PORT: %v, using default", err)
        }
    }
    
    notificationService := NewNotificationService(*dbQueries, emailConfig)
    ctx := context.Background()
    notificationService.StartNotificationWorker(ctx)
    notificationService.StartStarredFeedNotificationWorker(ctx)

	apiCfg := apiConfig{
		DB: dbQueries,
        NotificationService: notificationService,
	}

 

	router := chi.NewRouter()

	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	v1Router := chi.NewRouter()
    router.Mount("/v1", v1Router)

	v1Router.Post("/users", apiCfg.handlerUsersCreate)
	v1Router.Get("/users", apiCfg.middlewareAuth(apiCfg.handlerUsersGet))
	v1Router.Post("/login", apiCfg.handlerLoginUser)

	v1Router.Post("/feeds", apiCfg.middlewareAuth(apiCfg.handlerFeedCreate))
	v1Router.Get("/feeds", apiCfg.handlerGetFeeds)

	v1Router.Get("/posts", apiCfg.middlewareAuth(apiCfg.handlerGetPosts))

	v1Router.Get("/feed_follows", apiCfg.middlewareAuth(apiCfg.handlerFeedFollowsGet))
	v1Router.Post("/feed_follows", apiCfg.middlewareAuth(apiCfg.handlerFeedFollowCreate))
	v1Router.Delete("/feed_follows/{feedFollowID}", apiCfg.middlewareAuth(apiCfg.handlerFeedFollowDelete))
	
	v1Router.Post("/summarize", apiCfg.middlewareAuth(apiCfg.handlerSummarize))
    v1Router.Post("/starred-feeds", apiCfg.middlewareAuth(apiCfg.CreateStarredFeedHandler))
    v1Router.Get("/starred-feeds", apiCfg.middlewareAuth(apiCfg.GetStarredFeedsHandler))
    v1Router.Delete("/starred-feeds/{feedID}", apiCfg.middlewareAuth(apiCfg.handleDeleteStarredFeed))
    v1Router.Get("/starred-feeds/posts", apiCfg.middlewareAuth(apiCfg.GetRecentPostsFromStarredFeedsHandler))

	v1Router.Get("/notification-settings", apiCfg.middlewareAuth(apiCfg.GetNotificationSettingsHandler))
    v1Router.Patch("/notification-settings", apiCfg.middlewareAuth(apiCfg.UpdateNotificationSettingsHandler))

	v1Router.Get("/healthz", handlerReadiness)
	v1Router.Get("/err", handlerErr)

	
	srv := &http.Server{
		Addr:    "0.0.0.0:" + port, 
		Handler: router,
	}

	const collectionConcurrency = 10
	const collectionInterval = time.Minute
	go startScraping(dbQueries, collectionConcurrency, collectionInterval)

	log.Printf("Serving on port: %s\n", port)
	log.Fatal(srv.ListenAndServe())
}

