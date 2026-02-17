const db = require('./src/config/db');

async function testConnection() {
    try {
        console.log('Testing connection...');
        const res = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', res.rows.map(r => r.table_name));

        for (const table of res.rows) {
            const cols = await db.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table.table_name]);
            console.log(`Columns for ${table.table_name}:`, cols.rows.map(c => `${c.column_name} (${c.data_type})`));
        }
    } catch (err) {
        console.error('DATABASE ERROR:', err);
    } finally {
        db.pool.end();
    }
}

testConnection().catch(e => console.error('GENERAL ERROR:', e));
