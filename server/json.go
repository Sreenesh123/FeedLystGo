package main
import (
	"encoding/json" 
	"log"          
	"net/http"      
)


func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) { // interface{} allows any type of data to be passed
	w.Header().Set("Content-Type", "application/json")
	dat, err := json.Marshal(payload) 
	if err != nil {
		log.Printf("Error marshalling JSON: %s", err)
		w.WriteHeader(500)
		return
	}
	w.WriteHeader(code)
	w.Write(dat)
}

func respondWithError(w http.ResponseWriter, code int, msg string) {
	if code > 499 {
		log.Printf("Responding with 5XX error: %s", msg)
	}
	type errorResponse struct {
		Error string `json:"error"`
	}
	respondWithJSON(w, code, errorResponse{
		Error: msg,
	})
}