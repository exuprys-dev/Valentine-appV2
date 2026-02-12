// Script to initialize database tables automatically
const pool = require('./db');
const createAdmin = require('./create-admin');

async function initDatabase() {
  try {
    console.log('🔄 Checking database status...');

    // RESET logic if environment variable is set
    if (process.env.DB_RESET === 'true') {
      console.log('🗑️ DB_RESET is true. Dropping tables for a clean reset...');
      try {
        await pool.query('DROP TABLE IF EXISTS matches CASCADE');
        await pool.query('DROP TABLE IF EXISTS users CASCADE');
        console.log('✅ Tables dropped.');
      } catch (e) {
        // Simple drop for MySQL
        await pool.query('DROP TABLE IF EXISTS matches');
        await pool.query('DROP TABLE IF EXISTS users');
        console.log('✅ Tables dropped (MySQL).');
      }
    }

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        firstname VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        hobbies TEXT,
        sex VARCHAR(50),
        image_url VARCHAR(255) DEFAULT NULL,
        match_id INT DEFAULT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');

    // Create matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Matches table ready');

    // Create votes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL UNIQUE,
        match_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id),
        CONSTRAINT fk_match FOREIGN KEY(match_id) REFERENCES matches(id)
      )
    `);
    console.log('✅ Votes table ready');

    // Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key_name VARCHAR(255) UNIQUE NOT NULL,
        value_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Settings table ready');

    // Initialize voting_enabled setting if it doesn't exist
    const [existingSetting] = await pool.query("SELECT * FROM settings WHERE key_name = 'voting_enabled'");
    if (existingSetting.rows ? existingSetting.rows.length === 0 : (existingSetting.length === 0 || !existingSetting)) {
      await pool.query("INSERT INTO settings (key_name, value_text) VALUES ('voting_enabled', 'false') ON DUPLICATE KEY UPDATE key_name = key_name");
    }

    // If we just reset, create the admin
    if (process.env.DB_RESET === 'true') {
      await createAdmin();
      console.log('✅ Initial admin account recreated.');
    }

    console.log('✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
}

module.exports = initDatabase;
