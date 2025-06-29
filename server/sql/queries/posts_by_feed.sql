-- name: GetPostsByFeed :many
SELECT id, created_at, updated_at, title, url, description, published_at, feed_id 
FROM posts
WHERE feed_id = $1
ORDER BY published_at DESC NULLS LAST, created_at DESC
LIMIT 100;
