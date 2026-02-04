-- CREATE TABLE users(
--     userId VARCHAR(50) UNIQUE PRIMARY KEY,
--     name VARCHAR(50) UNIQUE NOT NULL,
--     email VARCHAR(50) UNIQUE NOT NULL,
--     password VARCHAR(50) UNIQUE NOT NULL
-- )

-- CREATE TABLE posts(
--     postId VARCHAR(50) UNIQUE PRIMARY KEY,
--     subject VARCHAR(50),
--     content VARCHAR(200),
--     date_posted DATE,
--     userId VARCHAR(50),
--     FOREIGN KEY (userId) REFERENCES users(userId)
-- );

-- Alter table posts
-- ADD date DATE;