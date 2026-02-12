require('dotenv').config();

// Detect database type from DATABASE_URL
const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

let pool;

if (isPostgres) {
  // PostgreSQL configuration (for Render, Railway, etc.)
  const { Pool } = require('pg');

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Wrap pg pool to match mysql2 interface
  const originalQuery = pool.query.bind(pool);
  pool.query = async (sql, params) => {
    if (typeof sql === 'string') {
      if (params) {
        let index = 1;
        sql = sql.replace(/\?/g, () => `$${index++}`);
      }

      // For INSERT queries, append RETURNING id to get the insertId
      if (sql.trim().toLowerCase().startsWith('insert')) {
        // Only if it doesn't already have one
        if (!sql.toLowerCase().includes('returning')) {
          sql = sql.replace(/;?$/, ' RETURNING id');
        }
      }
    }
    const result = await originalQuery(sql, params);

    // Mock the result structure for mysql2
    const rows = result.rows;
    const fields = result.fields;
    const mockResult = rows;

    // For INSERT, mock insertId
    if (result.command === 'INSERT' && rows.length > 0) {
      mockResult.insertId = rows[0].id;
    }

    // For UPDATE/DELETE, mock affectedRows (rowCount)
    mockResult.affectedRows = result.rowCount;

    return [mockResult, fields];
  };

  // Also add execute() method (alias to query for PostgreSQL)
  pool.execute = pool.query;
} else {
  // MySQL configuration (for local dev, AlwaysData, etc.)
  const mysql = require('mysql2/promise');

  let dbConfig;
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    dbConfig = {
      host: url.hostname,
      port: url.port || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace('/', ''),
    };
  } else {
    dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'valentine_db',
    };
  }

  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

module.exports = pool;
