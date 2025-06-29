-- +goose Up
ALTER TABLE users ADD COLUMN api_key VARCHAR(64) UNIQUE NOT NULL DEFAULT (
    encode(sha256(random()::text::bytea), 'hex') -- Generate a default but random API key for already existing records in the table;
);

-- +goose Down
ALTER TABLE users DROP COLUMN api_key;