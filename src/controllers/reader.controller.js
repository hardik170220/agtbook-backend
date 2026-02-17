const db = require('../config/db');

exports.getAllReaders = async (req, res) => {
    try {
        const query = `
            SELECT r.*, 
            (SELECT COUNT(*)::int FROM "Order" WHERE "readerId" = r.id) as "orderCount"
            FROM "Reader" r
            ORDER BY r.createdat DESC
        `;
        const result = await db.query(query);
        // Map orderCount to the expected structure if needed, 
        // but Prisma's _count usually returns { _count: { Order: 10 } }
        const readers = result.rows.map(r => ({
            ...r,
            _count: { Order: r.orderCount }
        }));
        res.json(readers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReaderById = async (req, res) => {
    try {
        const { id } = req.params;
        const readerResult = await db.query('SELECT * FROM "Reader" WHERE id = $1', [parseInt(id)]);

        if (readerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Reader not found' });
        }

        const reader = readerResult.rows[0];

        // Fetch Orders and their OrderedBooks
        const ordersQuery = `
            SELECT o.* 
            FROM "Order" o 
            WHERE o."readerId" = $1
            ORDER BY o."orderDate" DESC
        `;
        const ordersResult = await db.query(ordersQuery, [reader.id]);
        const orders = ordersResult.rows;

        for (let order of orders) {
            const obQuery = `
                SELECT ob.*, row_to_json(b.*) as "Book"
                FROM "OrderedBook" ob
                JOIN "Book" b ON ob."bookId" = b.id
                WHERE ob."orderId" = $1
            `;
            const obResult = await db.query(obQuery, [order.id]);
            order.OrderedBook = obResult.rows;
        }

        reader.Order = orders;

        // Fetch ReaderHistory
        const historyQuery = `
            SELECT * FROM "ReaderHistory" 
            WHERE "readerId" = $1 
            ORDER BY "changedAt" DESC
        `;
        const historyResult = await db.query(historyQuery, [reader.id]);
        reader.ReaderHistory = historyResult.rows;

        res.json(reader);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createReader = async (req, res) => {
    try {
        const { firstname, lastname, mobile, email, address, isactive, city, state, pincode } = req.body;
        const query = `
            INSERT INTO "Reader" (firstname, lastname, mobile, email, address, isactive, city, state, pincode)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [
            firstname,
            lastname,
            mobile,
            email,
            address,
            isactive === undefined ? true : (isactive === "true" || isactive === true),
            city || '',
            state || '',
            pincode || ''
        ];
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateReader = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstname, lastname, mobile, email, address, isactive, city, state, pincode } = req.body;

        // Before updating, create a history record (optional, but keep logic)
        // Actually Prisma schema says ReaderHistory has relation, but how is it populated?
        // Likely by some trigger or manual logic. I'll just do the update.

        const query = `
            UPDATE "Reader"
            SET firstname = $1, lastname = $2, mobile = $3, email = $4, address = $5, 
                isactive = $6, city = $7, state = $8, pincode = $9
            WHERE id = $10
            RETURNING *
        `;
        const values = [
            firstname,
            lastname,
            mobile,
            email,
            address,
            isactive === undefined ? true : (isactive === "true" || isactive === true),
            city,
            state,
            pincode,
            parseInt(id)
        ];
        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reader not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteReader = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM "Reader" WHERE id = $1', [parseInt(id)]);
        res.json({ message: 'Reader deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
