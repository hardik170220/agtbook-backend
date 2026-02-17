const db = require('./config/db');

async function main() {
    console.log("Attempting to connect to database...");
    try {
        const result = await db.query('SELECT NOW()');
        console.log("Connection established. Current time:", result.rows[0].now);

        console.log("Querying languages...");
        const languages = await db.query('SELECT * FROM "Language"');
        console.log("Success! Found languages:", languages.rows);
    } catch (e) {
        console.error("Detailed Error:", e);
    } finally {
        await db.pool.end();
    }
}

main();
