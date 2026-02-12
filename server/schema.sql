CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  firstname VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  hobbies TEXT, -- Stored as JSON string
  image_url VARCHAR(255) DEFAULT NULL,
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
CREATE TABLE IF NOT EXISTS votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  match_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id),
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (match_id) REFERENCES matches (id)
);

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(255) UNIQUE NOT NULL,
  value_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);