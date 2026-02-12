const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Post a vote for a match
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Check if voting is enabled
        const [settings] = await pool.execute("SELECT value_text FROM settings WHERE key_name = 'voting_enabled'");
        const isEnabled = settings.length > 0 && settings[0].value_text === 'true';

        if (!isEnabled) {
            return res.status(403).json({ error: 'Le système de vote est actuellement désactivé' });
        }

        const { matchId } = req.body;
        const userId = req.userData.userId;

        if (!matchId) {
            return res.status(400).json({ error: 'matchId est requis' });
        }
        // ... rest of the code

        // Check if user already voted
        const [existingVote] = await pool.execute('SELECT * FROM votes WHERE user_id = ?', [userId]);
        if (existingVote.length > 0) {
            return res.status(400).json({ error: 'Vous avez déjà voté' });
        }

        // Insert vote
        await pool.execute('INSERT INTO votes (user_id, match_id) VALUES (?, ?)', [userId, matchId]);

        res.json({ success: true, message: 'Vote enregistré avec succès' });
    } catch (error) {
        console.error('❌ Erreur lors du vote:', error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement du vote' });
    }
});

// Get voting results
router.get('/results', authMiddleware, async (req, res) => {
    try {
        const isAdmin = req.userData.isAdmin === true || req.userData.isAdmin === 1 || req.userData.isAdmin === 'true';

        // Check if voting is enabled to decide whether to hide counts
        const [settings] = await pool.execute("SELECT value_text FROM settings WHERE key_name = 'voting_enabled'");
        const isVotingEnabled = settings.length > 0 && settings[0].value_text === 'true';

        const [results] = await pool.execute(`
            SELECT 
                m.id as match_id,
                COUNT(v.id) as vote_count
            FROM matches m
            LEFT JOIN votes v ON v.match_id = m.id
            GROUP BY m.id
            ORDER BY vote_count DESC
        `);

        // Only reveal results to admins. Keep them hidden for regular users.
        const shouldReveal = isAdmin;

        let resultsWithPrivacy = results.map(r => ({
            ...r,
            vote_count: shouldReveal ? r.vote_count : 0
        }));

        // If not admin, shuffle the results so they can't guess the ranking by order
        if (!shouldReveal) {
            resultsWithPrivacy = resultsWithPrivacy.sort(() => Math.random() - 0.5);
        }

        // Fetch user information for each match
        const [matchUsers] = await pool.execute(`
            SELECT 
                u.id, 
                u.name, 
                u.firstname, 
                u.image_url, 
                u.match_id
            FROM users u
            WHERE u.match_id IS NOT NULL
        `);

        // Group users by match_id
        const userGroups = matchUsers.reduce((acc, user) => {
            if (!acc[user.match_id]) acc[user.match_id] = [];
            acc[user.match_id].push({
                id: user.id,
                name: user.name,
                firstname: user.firstname,
                image_url: user.image_url
            });
            return acc;
        }, {});

        // Combine results with user details
        const enrichedResults = resultsWithPrivacy.map(r => ({
            match_id: r.match_id,
            vote_count: r.vote_count,
            users: userGroups[r.match_id] || []
        }));

        res.json(enrichedResults);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des résultats:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des résultats' });
    }
});

// Check if user has voted
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const userId = req.userData.userId;
        const [vote] = await pool.execute('SELECT * FROM votes WHERE user_id = ?', [userId]);

        res.json({
            hasVoted: vote.length > 0,
            vote: vote.length > 0 ? vote[0] : null
        });
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du statut du vote:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
