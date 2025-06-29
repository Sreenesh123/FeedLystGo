-- name: CreatePost :one
INSERT INTO posts (id, created_at, updated_at, title, url, description, published_at, feed_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetPostsForUser :many
SELECT posts.* FROM posts
JOIN feed_follows ON feed_follows.feed_id = posts.feed_id
WHERE feed_follows.user_id = $1
ORDER BY posts.published_at DESC
LIMIT $2;

-- name: GetPostsByFeedID :many
SELECT * FROM posts
WHERE feed_id = $1
ORDER BY published_at DESC
LIMIT $2 OFFSET $3;

-- name: GetRecentPosts :many
SELECT * FROM posts
WHERE created_at > $1
ORDER BY created_at DESC;

-- name: GetRecentPostsInStarredFeeds :many
SELECT p.*, f.name as feed_name FROM posts p
JOIN feeds f ON p.feed_id = f.id
JOIN starred_feeds sf ON f.id = sf.feed_id
WHERE p.created_at > $1
ORDER BY p.created_at DESC;