const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, firstname, password, hobbies } = req.body;

        // Basic validation
        if (!name || !firstname || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user exists (optional, keeping it simple for now)

        const hashedPassword = await bcrypt.hash(password, 10);
        const hobbiesJson = JSON.stringify(hobbies || []);

        const [result] = await pool.execute(
            'INSERT INTO users (name, firstname, password, hobbies) VALUES (?, ?, ?, ?)',
            [name, firstname, hashedPassword, hobbiesJson]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body; // Login with name? or combine name+firstname?
        // Request says "inscrire son name firstname". Usually login is with one identifier.
        // Let's assume login is with `name` (lastname) for now, or maybe they provide both?
        // Let's stick to `name` as username for now, or add an `email` field?
        // The prompt didn't specify email. Let's use `name` as the identifier.

        if (!name || !password) {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        const [rows] = await pool.execute('SELECT * FROM users WHERE name = ?', [name]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, isAdmin: !!user.is_admin },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                firstname: user.firstname,
                isAdmin: !!user.is_admin,
                hobbies: JSON.parse(user.hobbies || "[]")
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

module.exports = router;
