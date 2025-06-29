

package database

import (
	"context"

	"github.com/google/uuid"
)

const getPostsByFeed = `-- name: GetPostsByFeed :many
SELECT id, created_at, updated_at, title, url, description, published_at, feed_id 
FROM posts
WHERE feed_id = $1
ORDER BY published_at DESC NULLS LAST, created_at DESC
LIMIT 100
`

func (q *Queries) GetPostsByFeed(ctx context.Context, feedID uuid.UUID) ([]Post, error) {
	rows, err := q.db.QueryContext(ctx, getPostsByFeed, feedID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Post
	for rows.Next() {
		var i Post
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.Title,
			&i.Url,
			&i.Description,
			&i.PublishedAt,
			&i.FeedID,
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
