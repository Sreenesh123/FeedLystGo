-- name: CreateStarredFeed :one
INSERT INTO starred_feeds (id, user_id, feed_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, user_id, feed_id, created_at, updated_at;

-- name: GetStarredFeedsForUser :many
SELECT f.*
FROM feeds f
JOIN starred_feeds sf ON f.id = sf.feed_id
WHERE sf.user_id = $1
ORDER BY f.name;

-- name: DeleteStarredFeed :exec
DELETE FROM starred_feeds
WHERE user_id = $1 AND feed_id = $2;

-- name: CheckFeedIsStarred :one
SELECT EXISTS(
    SELECT 1 FROM starred_feeds
    WHERE user_id = $1 AND feed_id = $2
) as is_starred;

-- name: GetStarredFeed :one
SELECT id, user_id, feed_id, created_at, updated_at FROM starred_feeds
WHERE user_id = $1 AND feed_id = $2;

-- name: GetUsersStarringFeed :many
SELECT u.*
FROM users u
JOIN starred_feeds sf ON u.id = sf.user_id
WHERE sf.feed_id = $1
ORDER BY u.created_at;