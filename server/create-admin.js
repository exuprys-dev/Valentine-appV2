const pool = require('./db');
const bcrypt = require('bcrypt');

async function createAdmin() {
    try {
        const name = 'Admin';
        const firstname = 'System';
        const password = 'admin'; // Default password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const [rows] = await pool.query("SELECT * FROM users WHERE name = ?", [name]);

        if (rows.length > 0) {
            console.log("User 'Admin' already exists. Updating to admin...");
            await pool.query("UPDATE users SET is_admin = 1 WHERE name = ?", [name]);
        } else {
            console.log("Creating new user 'Admin'...");
            await pool.query(
                "INSERT INTO users (name, firstname, password, hobbies, is_admin) VALUES (?, ?, ?, ?, 1)",
                [name, firstname, hashedPassword, "[]"]
            );
        }

        console.log("Admin user ready.");
        console.log("Name: Admin");
        console.log("Password: admin");

        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

createAdmin();
