-- +goose Up
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_id UUID,
    metadata JSONB
);

-- Index for faster lookups by user
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Index for faster lookups of unread notifications
CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read);

-- +goose Down
DROP TABLE notifications;
