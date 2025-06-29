-- +goose Up
CREATE TABLE starred_feeds (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feed_id UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
    UNIQUE(user_id, feed_id)
);

-- Add index for faster queries
CREATE INDEX idx_starred_feeds_user_id ON starred_feeds(user_id);
CREATE INDEX idx_starred_feeds_feed_id ON starred_feeds(feed_id);

-- +goose Down
DROP TABLE starred_feeds;