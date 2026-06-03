USE leoworks;

ALTER TABLE users
    ADD COLUMN google_sub VARCHAR(255) NULL UNIQUE AFTER email;
