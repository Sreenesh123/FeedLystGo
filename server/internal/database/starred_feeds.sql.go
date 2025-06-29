
package database

import (
	"context"
	"time"

	"github.com/google/uuid"
)

const checkFeedIsStarred = `-- name: CheckFeedIsStarred :one
SELECT EXISTS(
    SELECT 1 FROM starred_feeds
    WHERE user_id = $1 AND feed_id = $2
) as is_starred
`

type CheckFeedIsStarredParams struct {
	UserID uuid.UUID
	FeedID uuid.UUID
}

func (q *Queries) CheckFeedIsStarred(ctx context.Context, arg CheckFeedIsStarredParams) (bool, error) {
	row := q.db.QueryRowContext(ctx, checkFeedIsStarred, arg.UserID, arg.FeedID)
	var is_starred bool
	err := row.Scan(&is_starred)
	return is_starred, err
}

const createStarredFeed = `-- name: CreateStarredFeed :one
INSERT INTO starred_feeds (id, user_id, feed_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, user_id, feed_id, created_at, updated_at
`

type CreateStarredFeedParams struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	FeedID    uuid.UUID
	CreatedAt time.Time
	UpdatedAt time.Time
}

type CreateStarredFeedRow struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	FeedID    uuid.UUID
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (q *Queries) CreateStarredFeed(ctx context.Context, arg CreateStarredFeedParams) (CreateStarredFeedRow, error) {
	row := q.db.QueryRowContext(ctx, createStarredFeed,
		arg.ID,
		arg.UserID,
		arg.FeedID,
		arg.CreatedAt,
		arg.UpdatedAt,
	)
	var i CreateStarredFeedRow
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.FeedID,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const deleteStarredFeed = `-- name: DeleteStarredFeed :exec
DELETE FROM starred_feeds
WHERE user_id = $1 AND feed_id = $2
`

type DeleteStarredFeedParams struct {
	UserID uuid.UUID
	FeedID uuid.UUID
}

func (q *Queries) DeleteStarredFeed(ctx context.Context, arg DeleteStarredFeedParams) error {
	_, err := q.db.ExecContext(ctx, deleteStarredFeed, arg.UserID, arg.FeedID)
	return err
}

const getStarredFeed = `-- name: GetStarredFeed :one
SELECT id, user_id, feed_id, created_at, updated_at FROM starred_feeds
WHERE user_id = $1 AND feed_id = $2
`

type GetStarredFeedParams struct {
	UserID uuid.UUID
	FeedID uuid.UUID
}

type GetStarredFeedRow struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	FeedID    uuid.UUID
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (q *Queries) GetStarredFeed(ctx context.Context, arg GetStarredFeedParams) (GetStarredFeedRow, error) {
	row := q.db.QueryRowContext(ctx, getStarredFeed, arg.UserID, arg.FeedID)
	var i GetStarredFeedRow
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.FeedID,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getStarredFeedsForUser = `-- name: GetStarredFeedsForUser :many
SELECT f.id, f.created_at, f.updated_at, f.name, f.url, f.user_id, f.last_fetched_at
FROM feeds f
JOIN starred_feeds sf ON f.id = sf.feed_id
WHERE sf.user_id = $1
ORDER BY f.name
`

func (q *Queries) GetStarredFeedsForUser(ctx context.Context, userID uuid.UUID) ([]Feed, error) {
	rows, err := q.db.QueryContext(ctx, getStarredFeedsForUser, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Feed
	for rows.Next() {
		var i Feed
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.Name,
			&i.Url,
			&i.UserID,
			&i.LastFetchedAt,
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

const getUsersStarringFeed = `-- name: GetUsersStarringFeed :many
SELECT u.id, u.created_at, u.updated_at, u.name, u.api_key, u.email, u.password
FROM users u
JOIN starred_feeds sf ON u.id = sf.user_id
WHERE sf.feed_id = $1
ORDER BY u.created_at
`

func (q *Queries) GetUsersStarringFeed(ctx context.Context, feedID uuid.UUID) ([]User, error) {
	rows, err := q.db.QueryContext(ctx, getUsersStarringFeed, feedID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []User
	for rows.Next() {
		var i User
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.Name,
			&i.ApiKey,
			&i.Email,
			&i.Password,
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
