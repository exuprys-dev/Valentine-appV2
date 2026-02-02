const pool = require('./db');

async function testConnection() {
    try {
        console.log('Testing connection...');
        const connection = await pool.getConnection();
        console.log('Connection successful!');

        console.log('Testing query...');
        const [rows] = await connection.query('SHOW TABLES');
        console.log('Tables:', rows);

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Database Connection Error:', error);
        process.exit(1);
    }
}

testConnection();
