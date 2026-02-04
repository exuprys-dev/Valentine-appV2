const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, firstname, password, hobbies, sex } = req.body;

        // Basic validation
        if (!name || !firstname || !password || !sex) {
            return res.status(400).json({ error: 'Veuillez remplir tous les champs' });
        }

        // Check if user exists 
        const [rows] = await pool.execute('SELECT * FROM users WHERE name = ? AND firstname = ? AND sex = ?', [name, firstname, sex]);
        if (rows.length > 0) {
            return res.status(400).json({ error: 'Utilisateur déjà inscrit' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hobbiesJson = JSON.stringify(hobbies || []);

        const [result] = await pool.execute(
            'INSERT INTO users (name, firstname, password, hobbies, sex) VALUES (?, ?, ?, ?, ?)',
            [name, firstname, hashedPassword, hobbiesJson, sex]
        );

        res.status(201).json({ message: 'Utilisateur enregistré avec succès', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
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
            return res.status(400).json({ error: 'Veuillez remplir tous les champs' });
        }

        const [rows] = await pool.execute('SELECT * FROM users WHERE name = ?', [name]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Identifiants invalides' });
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
                hobbies: JSON.parse(user.hobbies || "[]"),
                sex: user.sex
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
    }
});

module.exports = router;
