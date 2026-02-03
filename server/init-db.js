// Script to initialize database tables automatically
const pool = require('./db');
const createAdmin = require('./create-admin');

async function initDatabase() {
  try {
    console.log('🔄 Checking database status...');

    // RESET logic if environment variable is set
    if (process.env.DB_RESET === 'true') {
      console.log('🗑️ DB_RESET is true. Clearing all tables...');
      await pool.query('TRUNCATE TABLE users, matches RESTART IDENTITY CASCADE');
      console.log('✅ Tables cleared.');
    }

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        firstname VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        hobbies TEXT,
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
