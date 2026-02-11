const express = require('express');
const router = express.Router();
const pool = require('../db');
const { calculateSimilarity, calculateSexSimilarity } = require('../utils/matcher');

// Trigger matching algorithm
router.post('/match', async (req, res) => {
    try {
        console.log('🔄 Lancement de l\'algorithme de mise en relation...');

        // 1. Récupérer tous les utilisateurs de la base de données sauf l'admin
        const [users] = await pool.execute('SELECT * FROM users WHERE is_admin != 1');

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
            details: error.message
        });
    }
});

// Get all matches and their users
router.get('/matches', async (req, res) => {
    try {
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

module.exports = router;
