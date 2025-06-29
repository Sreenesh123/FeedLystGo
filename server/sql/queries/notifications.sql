-- name: CreateNotification :one
INSERT INTO notifications (id, created_at, updated_at, user_id, type, message, is_read, reference_id, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, created_at, updated_at, user_id, type, message, is_read, reference_id, metadata;

-- name: GetNotificationsForUser :many
SELECT id, created_at, updated_at, user_id, type, message, is_read, reference_id, metadata
FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetUnreadNotificationsForUser :many
SELECT id, created_at, updated_at, user_id, type, message, is_read, reference_id, metadata
FROM notifications
WHERE user_id = $1 AND is_read = false
ORDER BY created_at DESC;

-- name: MarkNotificationAsRead :one
UPDATE notifications
SET is_read = true, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING id, created_at, updated_at, user_id, type, message, is_read, reference_id, metadata;

-- name: MarkAllNotificationsAsRead :exec
UPDATE notifications
SET is_read = true, updated_at = NOW()
WHERE user_id = $1 AND is_read = false;

-- name: DeleteNotification :exec
DELETE FROM notifications
WHERE id = $1 AND user_id = $2;
