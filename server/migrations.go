
package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	godotenv.Load(".env")
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer db.Close()
	err = db.Ping()
	if err != nil {
		log.Fatalf("Error pinging database: %v", err)
	}
	log.Println("Successfully connected to the database")
	maskedURL := dbURL
	if strings.Contains(maskedURL, "password=") {
		parts := strings.Split(maskedURL, "password=")
		if len(parts) > 1 {
			pwdEnd := strings.Index(parts[1], " ")
			if pwdEnd == -1 {
				pwdEnd = strings.Index(parts[1], "&")
			}
			if pwdEnd != -1 {
				maskedURL = parts[0] + "password=*****" + parts[1][pwdEnd:]
			} else {
				maskedURL = parts[0] + "password=*****"
			}
		}
	}
	log.Printf("Using database URL: %s", maskedURL)
	files, err := filepath.Glob("./sql/schema/*.sql")
	if err != nil {
		log.Fatalf("Error finding migration files: %v", err)
	}
	sort.Strings(files)
	log.Printf("Found %d migration files to process", len(files))
	for _, file := range files {
		log.Printf("Processing migration file: %s", file)
		content, err := ioutil.ReadFile(file)
		if err != nil {
			log.Fatalf("Error reading migration file %s: %v", file, err)
		}
		baseName := filepath.Base(file)
		migrationName := strings.TrimSuffix(baseName, filepath.Ext(baseName))
		var exists bool
		var tableExists bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'goose_db_version')").Scan(&tableExists)
		if err != nil {
			log.Fatalf("Error checking if goose_db_version table exists: %v", err)
		}
		if !tableExists {
			_, err := db.Exec(`CREATE TABLE IF NOT EXISTS goose_db_version (
				id SERIAL PRIMARY KEY,
				version_id TEXT NOT NULL,
				applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			)`)
			if err != nil {
				log.Fatalf("Error creating goose_db_version table: %v", err)
			}
			exists = false
		} else {
			err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM goose_db_version WHERE version_id = $1)", migrationName).Scan(&exists)
			if err != nil {
				log.Fatalf("Error checking if migration has been applied: %v", err)
			}
		}

		if exists {
			log.Printf("Migration %s has already been applied, skipping", migrationName)
			continue
		}

		parts := strings.Split(string(content), "-- +goose Down")
		if len(parts) < 2 {
			parts = append(parts, "") 
		}
		upSQL := parts[0]
		upSQL = strings.Replace(upSQL, "-- +goose Up", "", 1)
		log.Printf("Applying migration %s...", migrationName)
		_, err = db.Exec(upSQL)
		if err != nil {
			log.Fatalf("Error applying migration %s: %v", migrationName, err)
		}
		_, err = db.Exec("INSERT INTO goose_db_version (version_id) VALUES ($1)", migrationName)
		if err != nil {
			log.Fatalf("Error recording migration %s: %v", migrationName, err)
		}
		
		log.Printf("Successfully applied migration %s", migrationName)
	}

	fmt.Println("All migrations have been applied successfully")
}
