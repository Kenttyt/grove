USE leoworks;

ALTER TABLE users
    CHANGE COLUMN name username VARCHAR(120) NOT NULL;
