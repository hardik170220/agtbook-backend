const db = require('../config/db');

exports.createInterest = async (req, res) => {
    try {
        const { bookId, name, mobile, email, notes } = req.body;

        // Check if reader exists, if not create one
        let reader;
        const readerResult = await db.query('SELECT * FROM "Reader" WHERE mobile = $1', [mobile]);

        if (readerResult.rows.length === 0) {
            // Split name into first and last name
            const nameParts = name ? name.trim().split(' ') : ['Unknown'];
            const firstname = nameParts[0];
            const lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const insertReader = `
                INSERT INTO "Reader" (firstname, lastname, mobile, email, isactive, createdat, city, state, pincode)
                VALUES ($1, $2, $3, $4, true, NOW(), '', '', '')
                RETURNING *
            `;
            const insertResult = await db.query(insertReader, [firstname, lastname, mobile, email]);
            reader = insertResult.rows[0];
        } else {
            reader = readerResult.rows[0];
        }

        // Create interest (Note: Interest table doesn't exist in schema, this might be a legacy feature)
        // If Interest table exists, uncomment and adjust the following:
        // const insertInterest = `
        //     INSERT INTO "Interest" ("bookId", "readerId", notes, "createdAt")
        //     VALUES ($1, $2, $3, NOW())
        //     RETURNING *
        // `;
        // const interestResult = await db.query(insertInterest, [parseInt(bookId), reader.id, notes]);
        // res.status(201).json(interestResult.rows[0]);

        // For now, return a placeholder response
        res.status(201).json({
            message: 'Interest table not found in schema. This endpoint may need updating.',
            bookId: parseInt(bookId),
            readerId: reader.id,
            notes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllInterests = async (req, res) => {
    try {
        // Note: Interest table doesn't exist in the current schema
        // If it exists, use this query:
        // const query = `
        //     SELECT i.*, 
        //     row_to_json(b.*) as "Book", 
        //     row_to_json(r.*) as "Reader"
        //     FROM "Interest" i
        //     LEFT JOIN "Book" b ON i."bookId" = b.id
        //     LEFT JOIN "Reader" r ON i."readerId" = r.id
        //     ORDER BY i."createdAt" DESC
        // `;
        // const result = await db.query(query);
        // res.json(result.rows);

        res.json({ message: 'Interest table not found in schema' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getInterestsByBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        // const query = `
        //     SELECT i.*, row_to_json(r.*) as "Reader"
        //     FROM "Interest" i
        //     LEFT JOIN "Reader" r ON i."readerId" = r.id
        //     WHERE i."bookId" = $1
        // `;
        // const result = await db.query(query, [parseInt(bookId)]);
        // res.json(result.rows);

        res.json({ message: 'Interest table not found in schema', bookId: parseInt(bookId) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getInterestsByReader = async (req, res) => {
    try {
        const { readerId } = req.params;
        // const query = `
        //     SELECT i.*, row_to_json(b.*) as "Book"
        //     FROM "Interest" i
        //     LEFT JOIN "Book" b ON i."bookId" = b.id
        //     WHERE i."readerId" = $1
        // `;
        // const result = await db.query(query, [parseInt(readerId)]);
        // res.json(result.rows);

        res.json({ message: 'Interest table not found in schema', readerId: parseInt(readerId) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
