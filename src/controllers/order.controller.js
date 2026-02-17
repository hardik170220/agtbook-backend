const db = require('../config/db');

exports.createOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { firstname, lastname, mobile, email, address, city, state, pincode, books, shippingDetails } = req.body;

        await client.query('BEGIN');

        // 1. Find or Create Reader
        let reader;
        const readerResult = await client.query('SELECT * FROM "Reader" WHERE mobile = $1', [mobile]);

        if (readerResult.rows.length === 0) {
            const insertReader = `
                INSERT INTO "Reader" (firstname, lastname, mobile, email, address, city, state, pincode, isactive, createdat)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
                RETURNING *
            `;
            const insertResult = await client.query(insertReader, [firstname, lastname, mobile, email, address, city, state, pincode]);
            reader = insertResult.rows[0];
        } else {
            reader = readerResult.rows[0];
            const hasChanges =
                reader.firstname !== firstname ||
                reader.lastname !== lastname ||
                reader.email !== email ||
                reader.address !== address ||
                reader.city !== city ||
                reader.state !== state ||
                reader.pincode !== pincode;

            if (hasChanges) {
                // Create history record
                const insertHistory = `
                    INSERT INTO "ReaderHistory" ("readerId", firstname, lastname, email, address, city, state, pincode, "changedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                `;
                await client.query(insertHistory, [reader.id, reader.firstname, reader.lastname, reader.email, reader.address, reader.city, reader.state, reader.pincode]);

                // Update reader
                const updateReader = `
                    UPDATE "Reader" SET 
                        firstname = $1, lastname = $2, email = $3, address = $4, city = $5, state = $6, pincode = $7
                    WHERE id = $8
                    RETURNING *
                `;
                const updateResult = await client.query(updateReader, [firstname, lastname, email, address, city, state, pincode, reader.id]);
                reader = updateResult.rows[0];
            }
        }

        // 2. Check Stock and Create Order
        const insertOrder = `
            INSERT INTO "Order" ("readerId", "shippingDetails", status, "orderDate", "createdAt", "updatedAt")
            VALUES ($1, $2, 'PENDING', NOW(), NOW(), NOW())
            RETURNING *
        `;
        const orderResult = await client.query(insertOrder, [reader.id, shippingDetails]);
        const order = orderResult.rows[0];

        const orderedBooks = [];
        for (const item of books) {
            const bookId = parseInt(item.bookId);
            const quantity = parseInt(item.quantity);

            const bookResult = await client.query('SELECT * FROM "Book" WHERE id = $1', [bookId]);
            if (bookResult.rows.length === 0) {
                throw new Error(`Book with ID ${bookId} not found`);
            }
            const book = bookResult.rows[0];

            const currentStock = book.stockQty || 0;
            let bookStatus = 'NEW_ORDER';
            if (currentStock < quantity) {
                bookStatus = 'WAITLISTED';
            }

            const newStock = currentStock - quantity;
            const isAvailable = newStock > 0;

            await client.query('UPDATE "Book" SET "stockQty" = $1, "isAvailable" = $2 WHERE id = $3', [newStock, isAvailable, bookId]);

            const insertOB = `
                INSERT INTO "OrderedBook" ("orderId", "bookId", quantity, status)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const obResult = await client.query(insertOB, [order.id, bookId, quantity, bookStatus]);
            orderedBooks.push(obResult.rows[0]);
        }

        // Add Activity Log
        const insertLog = `
            INSERT INTO "ActivityLog" (description, "readerId", "orderId", "createdAt", action)
            VALUES ($1, $2, $3, NOW(), 'NOTE')
        `;
        await client.query(insertLog, ['Order placed', reader.id, order.id]);

        await client.query('COMMIT');
        order.OrderedBook = orderedBooks;
        res.status(201).json(order);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

exports.getAllOrders = async (req, res) => {
    const { status, city, state, search } = req.query;
    try {
        let conditions = [];
        let values = [];

        if (status) {
            const statuses = Array.isArray(status) ? status : [status];
            const placeholders = statuses.map(s => {
                values.push(s);
                return `$${values.length}`;
            });
            conditions.push(`o.status IN (${placeholders.join(',')})`);
        }

        if (city) {
            const cities = Array.isArray(city) ? city : [city];
            const placeholders = cities.map(c => {
                values.push(c);
                return `$${values.length}`;
            });
            conditions.push(`r.city IN (${placeholders.join(',')})`);
        }

        if (state) {
            const states = Array.isArray(state) ? state : [state];
            const placeholders = states.map(s => {
                values.push(s);
                return `$${values.length}`;
            });
            conditions.push(`r.state IN (${placeholders.join(',')})`);
        }

        if (search) {
            values.push(`%${search}%`);
            const idx = values.length;
            conditions.push(`(r.firstname ILIKE $${idx} OR r.lastname ILIKE $${idx} OR r.email ILIKE $${idx} OR o."shippingDetails" ILIKE $${idx})`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const query = `
            SELECT o.*, row_to_json(r.*) as "Reader"
            FROM "Order" o
            JOIN "Reader" r ON o."readerId" = r.id
            ${whereClause}
            ORDER BY o."orderDate" DESC
        `;
        const result = await db.query(query, values);

        const orders = result.rows;
        for (let order of orders) {
            const obResult = await db.query(`
                SELECT ob.*, row_to_json(b.*) as "Book"
                FROM "OrderedBook" ob
                JOIN "Book" b ON ob."bookId" = b.id
                WHERE ob."orderId" = $1
             `, [order.id]);
            order.OrderedBook = obResult.rows;
        }

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT o.*, row_to_json(r.*) as "Reader" FROM "Order" o JOIN "Reader" r ON o."readerId" = r.id WHERE o.id = $1', [parseInt(id)]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        const order = result.rows[0];

        const obResult = await db.query(`
            SELECT ob.*, row_to_json(b.*) as "Book"
            FROM "OrderedBook" ob
            JOIN "Book" b ON ob."bookId" = b.id
            WHERE ob."orderId" = $1
        `, [order.id]);
        order.OrderedBook = obResult.rows;

        const logResult = await db.query('SELECT * FROM "ActivityLog" WHERE "orderId" = $1 ORDER BY "createdAt" DESC', [order.id]);
        order.ActivityLog = logResult.rows;

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, description } = req.body;

        const existingOrder = await db.query('SELECT "readerId", status FROM "Order" WHERE id = $1', [parseInt(id)]);
        if (existingOrder.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        const previousStatus = existingOrder.rows[0].status;
        const readerId = existingOrder.rows[0].readerId;

        const updateResult = await db.query('UPDATE "Order" SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *', [status, parseInt(id)]);

        const logDesc = description || `Order status updated from ${previousStatus} -> ${status}`;
        await db.query('INSERT INTO "ActivityLog" (action, description, "readerId", "orderId", "createdAt") VALUES ($1, $2, $3, $4, NOW())', ['STATUS_CHANGE', logDesc, readerId, parseInt(id)]);

        res.json(updateResult.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrdersByReader = async (req, res) => {
    try {
        const { readerId } = req.params;
        const result = await db.query('SELECT * FROM "Order" WHERE "readerId" = $1 ORDER BY "orderDate" DESC', [parseInt(readerId)]);
        const orders = result.rows;

        for (let order of orders) {
            const obResult = await db.query(`
                SELECT ob.*, row_to_json(b.*) as "Book"
                FROM "OrderedBook" ob
                JOIN "Book" b ON ob."bookId" = b.id
                WHERE ob."orderId" = $1
             `, [order.id]);
            order.OrderedBook = obResult.rows;
        }
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBookOrderStats = async (req, res) => {
    try {
        const { bookId } = req.params;
        const query = `
            SELECT ob.*, row_to_json(o.*) as "Order", row_to_json(r.*) as "Reader"
            FROM "OrderedBook" ob
            JOIN "Order" o ON ob."orderId" = o.id
            JOIN "Reader" r ON o."readerId" = r.id
            WHERE ob."bookId" = $1
        `;
        const result = await db.query(query, [parseInt(bookId)]);
        const orderedBooks = result.rows;

        const totalQuantity = orderedBooks.reduce((sum, item) => sum + item.quantity, 0);
        const readersMap = new Map();
        orderedBooks.forEach(item => {
            if (item.Reader) {
                readersMap.set(item.Reader.id, item.Reader);
            }
        });
        const distinctReaders = Array.from(readersMap.values());

        res.json({
            bookId: parseInt(bookId),
            totalOrderedQuantity: totalQuantity,
            readersCount: distinctReaders.length,
            readers: distinctReaders
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrderedBookStatus = async (req, res) => {
    try {
        const { orderId, bookId } = req.params;
        const { status } = req.body;
        const parsedOrderId = parseInt(orderId);
        const parsedTargetId = parseInt(bookId);

        let result = await db.query('SELECT * FROM "OrderedBook" WHERE "orderId" = $1 AND "bookId" = $2', [parsedOrderId, parsedTargetId]);
        if (result.rows.length === 0) {
            result = await db.query('SELECT * FROM "OrderedBook" WHERE "orderId" = $1 AND id = $2', [parsedOrderId, parsedTargetId]);
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ordered book not found in this order' });
        }

        const orderedBook = result.rows[0];
        const updateResult = await db.query('UPDATE "OrderedBook" SET status = $1 WHERE id = $2 RETURNING *', [status, orderedBook.id]);

        res.json(updateResult.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrdersByBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const query = `
            SELECT ob.*, row_to_json(o.*) as "Order"
            FROM "OrderedBook" ob
            JOIN "Order" o ON ob."orderId" = o.id
            WHERE ob."bookId" = $1
            ORDER BY o."createdAt" ASC
        `;
        const result = await db.query(query, [parseInt(bookId)]);

        // Populate readers in the result to match Prisma's include
        for (let row of result.rows) {
            if (row.Order && row.Order.readerId) {
                const readerRes = await db.query('SELECT * FROM "Reader" WHERE id = $1', [row.Order.readerId]);
                row.Order.Reader = readerRes.rows[0];
            }
        }

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

