const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Get current user profile and match info
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData.userId;

        // Get user details
        const [users] = await pool.execute('SELECT id, name, firstname, hobbies, sex, match_id FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        const currentUser = users[0];
        currentUser.hobbies = JSON.parse(currentUser.hobbies || "[]");

        let matchData = null;

        if (currentUser.match_id) {
            // Find others with same match_id
            const [partners] = await pool.execute(
                'SELECT id, name, firstname, hobbies, sex FROM users WHERE match_id = ? AND id != ?',
                [currentUser.match_id, userId]
            );

            partners.forEach(p => {
                p.hobbies = JSON.parse(p.hobbies || "[]");
            });

            matchData = partners;
        }

        res.json({ user: currentUser, matches: matchData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
