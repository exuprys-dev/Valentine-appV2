const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { upload, isCloudinaryConfigured } = require('../middleware/upload');

// Register
router.post('/register', upload.single('image'), async (req, res) => {
    // MAINTENANCE MODE: Block all registrations
    return res.status(503).json({
        error: 'Les inscriptions sont temporairement fermées. Cupidon est en vacances ! 💘 Pour récupérer vos identifiants, contactez-nous sur WhatsApp : 40532331'
    });

    /* UNCOMMENT THIS BLOCK TO RE-ENABLE REGISTRATIONS
    try {
        let { name, firstname, password, hobbies, sex } = req.body;
        name = name?.trim();
        firstname = firstname?.trim();
    
        // imageUrl will be the path/url from multer (Cloudinary URL or local path)
        let imageUrl = null;
        if (req.file) {
            imageUrl = isCloudinaryConfigured ? req.file.path : `/uploads/${req.file.filename}`;
        }
    
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
        const hobbiesJson = typeof hobbies === 'string' ? hobbies : JSON.stringify(hobbies || []);
    
        const [result] = await pool.execute(
            'INSERT INTO users (name, firstname, password, hobbies, sex, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [name, firstname, hashedPassword, hobbiesJson, sex, imageUrl]
        );
    
        res.status(201).json({ message: 'Utilisateur enregistré avec succès', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
    }
    */
});

// Login
router.post('/login', async (req, res) => {
    try {
        let { name, password } = req.body;
        name = name?.trim();
        password = password?.trim();

        if (!name || !password) {
            return res.status(400).json({ error: 'Veuillez remplir tous les champs' });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE LOWER(name) = LOWER(?)',
            [name]
        );

        console.log(`🔍 Login attempt for name: "${name}"`);
        console.log(`📊 Found ${rows.length} user(s) with this name`);

        if (rows.length === 0) {
            console.log('❌ No users found');
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        let user = null;
        for (const u of rows) {
            console.log(`🔐 Testing password for user ID ${u.id} (${u.firstname})`);
            const isValid = await bcrypt.compare(password, u.password);
            console.log(`   Result: ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);
            if (isValid) {
                user = u;
                break;
            }
        }

        if (!user) {
            console.log('❌ No matching password found among all users');
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        console.log(`✅ Login successful for user ID ${user.id}`);

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
