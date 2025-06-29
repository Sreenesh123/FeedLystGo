    FROM golang:1.23-alpine AS builder
    WORKDIR /app
    COPY go.mod go.sum ./
    RUN go mod tidy && go mod download
    COPY . .
    RUN go mod tidy
    RUN CGO_ENABLED=0 GOOS=linux go build -o rssapp
    
    FROM alpine:3.18
    RUN apk --no-cache add ca-certificates tzdata
    WORKDIR /app
    COPY --from=builder /app/rssapp .
    COPY --from=builder /app/.env.example /app/.env
    RUN adduser -D -g '' appuser && \
        chown -R appuser:appuser /app
    USER appuser
    EXPOSE 8080
    CMD ["./rssapp"]
    