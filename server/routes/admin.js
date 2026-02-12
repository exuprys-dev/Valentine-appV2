const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { calculateSimilarity, calculateSexSimilarity } = require('../utils/matcher');

// Trigger matching algorithm
router.post('/match', authMiddleware, async (req, res) => {
    try {
        if (!req.userData.isAdmin) return res.status(403).json({ error: 'Accès refusé' });
        console.log('🔄 Lancement de l\'algorithme de mise en relation...');

        // 1. Récupérer tous les utilisateurs de la base de données
        const [allUsers] = await pool.execute('SELECT * FROM users');
        const users = allUsers.filter(u => u.is_admin != 1 && u.is_admin !== true);

        if (users.length < 2) {
            return res.status(400).json({ error: 'Pas assez d\'utilisateurs pour effectuer la mise en relation' });
        }

        console.log(`📊 Nombre total d'utilisateurs à mettre en relation : ${users.length}`);

        // 2. Parser les hobbies pour chaque utilisateur
        users.forEach(u => {
            try {
                u.hobbiesList = JSON.parse(u.hobbies || "[]");
            } catch (e) {
                console.warn(`⚠️ Échec de l'analyse des hobbies pour l'utilisateur ${u.id}, utilisation d'un tableau vide`);
                u.hobbiesList = [];
            }
        });

        // 3. Réinitialiser les anciens matches (optionnel)
        await pool.execute('UPDATE users SET match_id = NULL');
        // Clear votes first to avoid foreign key constraint failure
        await pool.execute('DELETE FROM votes');
        await pool.execute('DELETE FROM matches');

        // 4. Initialiser les variables
        let unmatched = [...users];
        const pairs = [];

        // Initialiser les groupes par sexe
        const hommes = unmatched.filter(u => u.sex === 'Masculin');
        const femmes = unmatched.filter(u => u.sex === 'Feminin');

        // Fonction pour mélanger un tableau (Fisher-Yates)
        const shuffle = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        shuffle(hommes);
        shuffle(femmes);

        // 5. Créer des paires
        // Priorité 1 : Hétérosexuels (Masculin + Feminin)
        while (hommes.length > 0 && femmes.length > 0) {
            pairs.push([hommes.pop(), femmes.pop()]);
        }

        // Priorité 2 : Regrouper les "Autres" et les restes
        let restes = unmatched.filter(u => u.sex !== 'Masculin' && u.sex !== 'Feminin');
        restes = [...restes, ...hommes, ...femmes];
        shuffle(restes);

        while (restes.length >= 2) {
            pairs.push([restes.pop(), restes.pop()]);
        }

        // Garder le reliquat s'il y en a un
        unmatched = restes;

        console.log(`📦 Création de ${pairs.length} paire(s)`);
        if (unmatched.length > 0) {
            console.log(`👥 Utilisateur restant non apparié: ${unmatched[0].name}`);
        }

        // 6. Sauvegarder les paires dans la base de données
        for (const pair of pairs) {
            // Créer un nouveau match
            const [matchResult] = await pool.execute('INSERT INTO matches (created_at) VALUES (CURRENT_TIMESTAMP)');
            const matchId = matchResult.insertId;

            // Assigner le match_id aux deux utilisateurs de la paire
            await pool.execute('UPDATE users SET match_id = ? WHERE id = ?', [matchId, pair[0].id]);
            await pool.execute('UPDATE users SET match_id = ? WHERE id = ?', [matchId, pair[1].id]);

            console.log(`💾 Mise en relation ${matchId} pour les utilisateurs ${pair[0].id} et ${pair[1].id}`);
        }

        // 7. Gérer le dernier utilisateur s'il reste seul
        if (unmatched.length === 1) {
            const soloUser = unmatched[0];
            console.log(`⚠️ Utilisateur ${soloUser.id} (${soloUser.name}) reste seul`);

            // Option 1: Le laisser avec match_id = NULL (reste seul)
            await pool.execute('UPDATE users SET match_id = NULL WHERE id = ?', [soloUser.id]);

            // Option 2 (alternative): Créer un match solo
            // const [matchResult] = await pool.execute('INSERT INTO matches () VALUES ()');
            // const matchId = matchResult.insertId;
            // await pool.execute('UPDATE users SET match_id = ? WHERE id = ?', [matchId, soloUser.id]);
        }

        console.log('✅ Processus de matching terminé avec succès');

        // 8. Récupérer et renvoyer les statistiques
        const [rawMatchStats] = await pool.execute(`
            SELECT 
                m.id as match_id,
                u.id as user_id,
                u.name as user_name
            FROM matches m
            LEFT JOIN users u ON u.match_id = m.id
            ORDER BY m.id
        `);

        // Agréger les statistiques en JavaScript pour compatibilité PostgreSQL
        const matchStatsMap = rawMatchStats.reduce((acc, row) => {
            if (!acc[row.match_id]) {
                acc[row.match_id] = {
                    match_id: row.match_id,
                    members_count: 0,
                    members: []
                };
            }
            if (row.user_id) {
                acc[row.match_id].members_count++;
                acc[row.match_id].members.push(`${row.user_name} (${row.user_id})`);
            }
            return acc;
        }, {});

        const matchStats = Object.values(matchStatsMap).map(m => ({
            ...m,
            members: m.members.join(', ')
        }));

        const [unmatchedUsers] = await pool.execute(`
            SELECT id, name, firstname 
            FROM users 
            WHERE match_id IS NULL
        `);

        res.json({
            success: true,
            message: 'Processus de matching terminé avec succès',
            stats: {
                total_users: users.length,
                total_pairs: pairs.length,
                matched_users: pairs.length * 2,
                unmatched_users: unmatchedUsers.length,
                matches: matchStats,
                solo_users: unmatchedUsers
            }
        });

    } catch (error) {
        console.error('❌ Erreur serveur lors de la mise en relation:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la mise en relation',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get all matches and their users
router.get('/matches', authMiddleware, async (req, res) => {
    try {
        if (!req.userData.isAdmin) return res.status(403).json({ error: 'Accès refusé' });
        const [matches] = await pool.execute(`
            SELECT 
                m.id as match_id,
                m.created_at,
                u.id as user_id,
                u.name,
                u.firstname,
                u.image_url,
                u.sex,
                u.hobbies
            FROM matches m
            JOIN users u ON u.match_id = m.id
            ORDER BY m.id
        `);

        // Group by match_id
        const groupedMatches = matches.reduce((acc, row) => {
            if (!acc[row.match_id]) {
                acc[row.match_id] = {
                    id: row.match_id,
                    created_at: row.created_at,
                    users: []
                };
            }
            acc[row.match_id].users.push({
                id: row.user_id,
                name: row.name,
                firstname: row.firstname,
                image_url: row.image_url,
                sex: row.sex,
                hobbies: JSON.parse(row.hobbies || "[]")
            });
            return acc;
        }, {});

        res.json(Object.values(groupedMatches));
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des matchs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get current settings
router.get('/settings', authMiddleware, async (req, res) => {
    try {
        if (!req.userData.isAdmin) return res.status(403).json({ error: 'Accès refusé' });
        const [settings] = await pool.execute('SELECT key_name, value_text FROM settings');
        const settingsMap = settings.reduce((acc, s) => {
            acc[s.key_name] = s.value_text;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des paramètres:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Toggle voting
router.post('/settings/voting', authMiddleware, async (req, res) => {
    try {
        if (!req.userData.isAdmin) return res.status(403).json({ error: 'Accès refusé' });
        const { enabled } = req.body;
        const value = enabled ? 'true' : 'false';

        await pool.execute(
            "INSERT INTO settings (key_name, value_text) VALUES ('voting_enabled', ?) ON DUPLICATE KEY UPDATE value_text = ?",
            [value, value]
        );

        res.json({ success: true, message: `Système de vote ${enabled ? 'activé' : 'désactivé'}` });
    } catch (error) {
        console.error('❌ Erreur lors de la modification du statut de vote:', error);
        // Try fallback for PostgreSQL if needed (using ON CONFLICT)
        try {
            const { enabled } = req.body;
            const value = enabled ? 'true' : 'false';
            await pool.execute(
                "INSERT INTO settings (key_name, value_text) VALUES ('voting_enabled', ?) ON CONFLICT (key_name) DO UPDATE SET value_text = EXCLUDED.value_text",
                [value]
            );
            return res.json({ success: true, message: `Système de vote ${enabled ? 'activé' : 'désactivé'}` });
        } catch (e) {
            res.status(500).json({ error: 'Erreur serveur lors de la mise à jour des paramètres' });
        }
    }
});

// Get all users for management
router.get('/users', authMiddleware, async (req, res) => {
    try {
        if (!req.userData.isAdmin) return res.status(403).json({ error: 'Accès refusé' });

        const [users] = await pool.execute(
            'SELECT id, name, firstname, sex, is_admin, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Reset user password
router.post('/users/:id/reset-password', authMiddleware, async (req, res) => {
    try {
        if (!req.userData.isAdmin) return res.status(403).json({ error: 'Accès refusé' });

        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) return res.status(400).json({ error: 'Le nouveau mot de passe est requis' });

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

        res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
