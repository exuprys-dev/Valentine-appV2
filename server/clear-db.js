const pool = require('./db');

async function clearDatabase() {
    try {
        console.log('🗑️ Clearing all tables...');

        // Disable triggers/constraints to truncate safely
        await pool.query('TRUNCATE TABLE users, matches RESTART IDENTITY CASCADE');

        console.log('✅ Database cleared successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error.message);
        process.exit(1);
    }
}

clearDatabase();
