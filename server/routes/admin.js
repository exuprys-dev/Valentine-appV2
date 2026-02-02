const express = require('express');
const router = express.Router();
const pool = require('../db');
const { calculateSimilarity } = require('../utils/matcher');

// Trigger matching algorithm
/* router.post('/match', async (req, res) => {
    try {
        // 1. Fetch all users who don't have a match_id yet
        // Note: In a real scenario we might want to rematch everyone, but let's assume we match new users or all users if reset.
        // Let's implement a "rematch all" strategy for simplicity as per requirement implies an event.

        // Reset matches (optional, or just match nulls)
        // await pool.execute('UPDATE users SET match_id = NULL');
        // await pool.execute('TRUNCATE TABLE matches'); 
        // Let's assume we are matching everyone who is currently in the DB.

        const [users] = await pool.execute('SELECT * FROM users');

        if (users.length < 2) {
            return res.status(400).json({ error: 'Not enough users to match' });
        }

        // Parse hobbies for each user
        users.forEach(u => {
            try {
                u.hobbiesList = JSON.parse(u.hobbies || "[]");
            } catch (e) {
                u.hobbiesList = [];
            }
        });

        let unmatched = [...users];
        const pairs = [];

        while (unmatched.length >= 2) {
            if (unmatched.length === 3) {
                // Special odd number case: handle all 3 to form a trio? 
                // Or pair 2 and have 1 left?
                // Requirement: "associer au couple avec lequel il match le plus"
                // So we should pair 2 normally, then assign the 3rd to the best couple.
                // But if we only have 3 left, we just make a trio.
                break;
            }

            let bestScore = -1;
            let bestPairIndices = [-1, -1];

            // Find best pair in current pool
            // Simple greedy: take the first user, find their best match.
            // Optimization: This is O(N^2) in worst case for global best, or O(N) for "best for current user".
            // Let's do "best for index 0" to keep it simple and fast enough.

            const u1 = unmatched[0];
            let bestMatchIndex = -1;
            let maxSim = -1;

            for (let i = 1; i < unmatched.length; i++) {
                const sim = calculateSimilarity(u1.hobbiesList, unmatched[i].hobbiesList);
                if (sim > maxSim) {
                    maxSim = sim;
                    bestMatchIndex = i;
                }
            }

            if (bestMatchIndex !== -1) {
                const u2 = unmatched[bestMatchIndex];
                pairs.push([u1, u2]);
                // Remove u2 then u1 (order matters if using splice, better filter)
                const u2Id = u2.id;
                unmatched.shift(); // remove u1
                unmatched = unmatched.filter(u => u.id !== u2Id);
            } else {
                // No match found (should imply 0 similarity, just pick random? or next?)
                // If 0 sim, pick the first available
                const u2 = unmatched[1];
                pairs.push([u1, u2]);
                unmatched.splice(0, 2);
            }
        }

        // Now save matches
        for (const pair of pairs) {
            const [matchResult] = await pool.execute('INSERT INTO matches () VALUES ()');
            const matchId = matchResult.insertId;

            for (const u of pair) {
                await pool.execute('UPDATE users SET match_id = ? WHERE id = ?', [matchId, u.id]);
            }
        }

        // Handle leftovers
        if (unmatched.length > 0) {
            const leftovers = unmatched;
            // For each leftover, find "ceui avec qui il match le plus" (best couple)
            // We look at created pairs.

            if (pairs.length === 0) {
                // Only 3 users total initially?
                // If 3 users [A, B, C], loop ran until break at 3.
                // Then unmatched has 3.
                // We should just make one match with all 3.
                if (leftovers.length >= 2) { // Should be 3
                    const [matchResult] = await pool.execute('INSERT INTO matches () VALUES ()');
                    const matchId = matchResult.insertId;
                    for (const u of leftovers) {
                        await pool.execute('UPDATE users SET match_id = ? WHERE id = ?', [matchId, u.id]);
                    }
                }
            } else {
                // We have pairs. Assign leftovers to best pair.
                for (const oddUser of leftovers) {
                    let bestPairIndex = -1;
                    let maxSim = -1;

                    // Compare oddUser with each pair (avg sim? max sim with any member?)
                    // "match le plus" -> let's say max average similarity.

                    pairs.forEach((pair, idx) => {
                        let pairSim = 0;
                        pair.forEach(u => {
                            pairSim += calculateSimilarity(oddUser.hobbiesList, u.hobbiesList);
                        });
                        // Avg
                        pairSim /= pair.length; // usually 2

                        if (pairSim > maxSim) {
                            maxSim = pairSim;
                            bestPairIndex = idx;
                        }
                    });

                    // If no similarity, pick first pair
                    if (bestPairIndex === -1) bestPairIndex = 0;

                    // Get the match ID of that pair. 
                    // Accessing DB to get match_id for one of the users in the pair.
                    const pairUser = pairs[bestPairIndex][0];
                    const [rows] = await pool.execute('SELECT match_id FROM users WHERE id = ?', [pairUser.id]);
                    const matchId = rows[0].match_id;

                    await pool.execute('UPDATE users SET match_id = ? WHERE id = ?', [matchId, oddUser.id]);
                }
            }
        }

        res.json({ message: 'Matching process completed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during matching' });
    }
}); */
router.post('/match', async (req, res) => {
    try {
        console.log('🔄 Starting matching process...');

        // 1. Récupérer tous les utilisateurs
        const [users] = await pool.execute('SELECT * FROM users');

        if (users.length < 2) {
            return res.status(400).json({ error: 'Not enough users to match (minimum 2 required)' });
        }

        console.log(`📊 Total users to match: ${users.length}`);

        // 2. Parser les hobbies pour chaque utilisateur
        users.forEach(u => {
            try {
                u.hobbiesList = JSON.parse(u.hobbies || "[]");
            } catch (e) {
                console.warn(`⚠️ Failed to parse hobbies for user ${u.id}, using empty array`);
                u.hobbiesList = [];
            }
        });

        // 3. Réinitialiser les anciens matches (optionnel)
        await pool.execute('UPDATE users SET match_id = NULL');
        await pool.execute('DELETE FROM matches');

        // 4. Initialiser les variables
        let unmatched = [...users];
        const pairs = [];

        // 5. Créer des paires (algorithme greedy)
        while (unmatched.length >= 2) {
            // Prendre le premier utilisateur non matché
            const u1 = unmatched[0];
            let bestMatchIndex = -1;
            let maxSim = -1;

            // Trouver son meilleur match parmi les utilisateurs restants
            for (let i = 1; i < unmatched.length; i++) {
                const sim = calculateSimilarity(u1.hobbiesList, unmatched[i].hobbiesList);
                if (sim > maxSim) {
                    maxSim = sim;
                    bestMatchIndex = i;
                }
            }

            // Créer la paire avec le meilleur match trouvé
            if (bestMatchIndex !== -1) {
                const u2 = unmatched[bestMatchIndex];
                pairs.push([u1, u2]);
                console.log(`✅ Paired: ${u1.name} (ID: ${u1.id}) ↔ ${u2.name} (ID: ${u2.id}) - Similarity: ${(maxSim * 100).toFixed(2)}%`);
                
                // Retirer les deux utilisateurs de la liste des non-matchés
                const u2Id = u2.id;
                unmatched.shift(); // Retire u1 (premier élément)
                unmatched = unmatched.filter(u => u.id !== u2Id); // Retire u2
            } else {
                // Aucune similarité trouvée, prendre simplement le suivant
                const u2 = unmatched[1];
                pairs.push([u1, u2]);
                console.log(`⚠️ Paired (no similarity): ${u1.name} (ID: ${u1.id}) ↔ ${u2.name} (ID: ${u2.id})`);
                unmatched.splice(0, 2);
            }
        }

        console.log(`📦 Created ${pairs.length} pair(s)`);
        console.log(`👥 Remaining unmatched users: ${unmatched.length}`);

        // 6. Sauvegarder les paires dans la base de données
        for (const pair of pairs) {
            // Créer un nouveau match
            const [matchResult] = await pool.execute('INSERT INTO matches () VALUES ()');
            const matchId = matchResult.insertId;

            // Assigner le match_id aux deux utilisateurs de la paire
            await pool.execute('UPDATE users SET match_id = ? WHERE id = ?', [matchId, pair[0].id]);
            await pool.execute('UPDATE users SET match_id = ? WHERE id = ?', [matchId, pair[1].id]);
            
            console.log(`💾 Saved match ${matchId} for users ${pair[0].id} and ${pair[1].id}`);
        }

        // 7. Gérer le dernier utilisateur s'il reste seul
        if (unmatched.length === 1) {
            const soloUser = unmatched[0];
            console.log(`⚠️ User ${soloUser.id} (${soloUser.name}) remains unmatched (odd number of users)`);
            
            // Option 1: Le laisser avec match_id = NULL (reste seul)
            await pool.execute('UPDATE users SET match_id = NULL WHERE id = ?', [soloUser.id]);
            
            // Option 2 (alternative): Créer un match solo
            // const [matchResult] = await pool.execute('INSERT INTO matches () VALUES ()');
            // const matchId = matchResult.insertId;
            // await pool.execute('UPDATE users SET match_id = ? WHERE id = ?', [matchId, soloUser.id]);
        }

        console.log('✅ Matching process completed successfully');

        // 8. Récupérer et renvoyer les statistiques
        const [matchStats] = await pool.execute(`
            SELECT 
                m.id as match_id,
                COUNT(u.id) as members_count,
                GROUP_CONCAT(CONCAT(u.name, ' (', u.id, ')') ORDER BY u.id SEPARATOR ', ') as members
            FROM matches m
            LEFT JOIN users u ON u.match_id = m.id
            GROUP BY m.id
            ORDER BY m.id
        `);

        const [unmatchedUsers] = await pool.execute(`
            SELECT id, name, firstname 
            FROM users 
            WHERE match_id IS NULL
        `);

        res.json({ 
            success: true,
            message: 'Matching process completed successfully',
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
        console.error('❌ Matching error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error during matching',
            details: error.message 
        });
    }
});

module.exports = router;
