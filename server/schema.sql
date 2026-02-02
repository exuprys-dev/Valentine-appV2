CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  firstname VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  hobbies TEXT, -- Stored as JSON string
  match_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: If we want to strictly enforce pairs/trios in a relational way, we might have a matches_users link table.
-- But given the simplicity, updating `match_id` in users table is enough to link them.
-- The `matches` table is just to generate a unique ID for the group.
