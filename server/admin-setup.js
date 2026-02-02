const pool = require('./db');

async function setupAdmin() {
    try {
        // Add column
        try {
            await pool.query("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;");
            console.log("Added is_admin column.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("is_admin column already exists.");
            } else {
                console.error("Error adding column:", e.message);
            }
        }

        // List users
        const [users] = await pool.query("SELECT id, name, firstname, is_admin FROM users");
        console.log("Current users:");
        console.table(users);

        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

setupAdmin();
