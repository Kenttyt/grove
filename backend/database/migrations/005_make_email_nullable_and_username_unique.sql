USE leoworks;

-- Drop email column
ALTER TABLE users
    DROP COLUMN email;

-- Make username unique
ALTER TABLE users
    ADD UNIQUE INDEX idx_username (username);
