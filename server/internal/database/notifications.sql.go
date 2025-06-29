
package database

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/sqlc-dev/pqtype"
)

const createNotification = `-- name: CreateNotification :one
INSERT INTO notifications (id, created_at, updated_at, user_id, type, message, is_read, reference_id, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, created_at, updated_at, user_id, type, message, is_read, reference_id, metadata
`

type CreateNotificationParams struct {
	ID          uuid.UUID
	CreatedAt   time.Time
	UpdatedAt   time.Time
	UserID      uuid.UUID
	Type        string
	Message     string
	IsRead      bool
	ReferenceID uuid.NullUUID
	Metadata    pqtype.NullRawMessage
}

func (q *Queries) CreateNotification(ctx context.Context, arg CreateNotificationParams) (Notification, error) {
	row := q.db.QueryRowContext(ctx, createNotification,
		arg.ID,
		arg.CreatedAt,
		arg.UpdatedAt,
		arg.UserID,
		arg.Type,
		arg.Message,
		arg.IsRead,
		arg.ReferenceID,
		arg.Metadata,
	)
	var i Notification
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.UserID,
		&i.Type,
		&i.Message,
		&i.IsRead,
		&i.ReferenceID,
		&i.Metadata,
	)
	return i, err
}

const deleteNotification = `-- name: DeleteNotification :exec
DELETE FROM notifications
WHERE id = $1 AND user_id = $2
`

type DeleteNotificationParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

func (q *Queries) DeleteNotification(ctx context.Context, arg DeleteNotificationParams) error {
	_, err := q.db.ExecContext(ctx, deleteNotification, arg.ID, arg.UserID)
	return err
}

const getNotificationsForUser = `-- name: GetNotificationsForUser :many
SELECT id, created_at, updated_at, user_id, type, message, is_read, reference_id, metadata
FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3
`

type GetNotificationsForUserParams struct {
	UserID uuid.UUID
	Limit  int32
	Offset int32
}

func (q *Queries) GetNotificationsForUser(ctx context.Context, arg GetNotificationsForUserParams) ([]Notification, error) {
	rows, err := q.db.QueryContext(ctx, getNotificationsForUser, arg.UserID, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Notification
	for rows.Next() {
		var i Notification
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.UserID,
			&i.Type,
			&i.Message,
			&i.IsRead,
			&i.ReferenceID,
			&i.Metadata,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getUnreadNotificationsForUser = `-- name: GetUnreadNotificationsForUser :many
SELECT id, created_at, updated_at, user_id, type, message, is_read, reference_id, metadata
FROM notifications
WHERE user_id = $1 AND is_read = false
ORDER BY created_at DESC
`

func (q *Queries) GetUnreadNotificationsForUser(ctx context.Context, userID uuid.UUID) ([]Notification, error) {
	rows, err := q.db.QueryContext(ctx, getUnreadNotificationsForUser, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Notification
	for rows.Next() {
		var i Notification
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.UserID,
			&i.Type,
			&i.Message,
			&i.IsRead,
			&i.ReferenceID,
			&i.Metadata,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const markAllNotificationsAsRead = `-- name: MarkAllNotificationsAsRead :exec
UPDATE notifications
SET is_read = true, updated_at = NOW()
WHERE user_id = $1 AND is_read = false
`

func (q *Queries) MarkAllNotificationsAsRead(ctx context.Context, userID uuid.UUID) error {
	_, err := q.db.ExecContext(ctx, markAllNotificationsAsRead, userID)
	return err
}

const markNotificationAsRead = `-- name: MarkNotificationAsRead :one
UPDATE notifications
SET is_read = true, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING id, created_at, updated_at, user_id, type, message, is_read, reference_id, metadata
`

type MarkNotificationAsReadParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

func (q *Queries) MarkNotificationAsRead(ctx context.Context, arg MarkNotificationAsReadParams) (Notification, error) {
	row := q.db.QueryRowContext(ctx, markNotificationAsRead, arg.ID, arg.UserID)
	var i Notification
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.UserID,
		&i.Type,
		&i.Message,
		&i.IsRead,
		&i.ReferenceID,
		&i.Metadata,
	)
	return i, err
}
