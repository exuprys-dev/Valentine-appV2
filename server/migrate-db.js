const pool = require('./db');

async function migrate() {
    try {
        console.log('🔄 Démarrage de la migration...');

        // Check if image_url exists
        const [columns] = await pool.query('SHOW COLUMNS FROM users LIKE "image_url"');

        if (columns.length === 0) {
            console.log('➕ Ajout de la colonne image_url à la table users...');
            await pool.query('ALTER TABLE users ADD COLUMN image_url VARCHAR(255) DEFAULT NULL AFTER sex');
            console.log('✅ Colonne image_url ajoutée avec succès.');
        } else {
            console.log('ℹ️ La colonne image_url existe déjà.');
        }

        console.log('✅ Migration terminée !');
        process.exit(0);
    } catch (error) {
        // If SHOW COLUMNS fails (e.g. on PostgreSQL), try a different approach or just attempt the ALTER
        try {
            console.log('🔄 Tentative d\'ajout direct (PostgreSQL ou autre)...');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) DEFAULT NULL');
            console.log('✅ Migration terminée (IF NOT EXISTS)!');
            process.exit(0);
        } catch (innerError) {
            console.error('❌ Erreur de migration:', innerError.message);
            process.exit(1);
        }
    }
}

migrate();
