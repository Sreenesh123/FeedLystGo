-- +goose Up
ALTER TABLE users
ADD COLUMN email TEXT UNIQUE ,
ADD COLUMN password TEXT ;

-- +goose Down
ALTER TABLE users
DROP COLUMN email,
DROP COLUMN password;
