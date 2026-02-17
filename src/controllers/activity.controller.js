const db = require('../config/db');

// Get all activity logs
exports.getAllActivityLogs = async (req, res) => {
    try {
        const query = `
            SELECT al.*, 
            row_to_json(o.*) as "Order", 
            row_to_json(r.*) as "Reader"
            FROM "ActivityLog" al
            LEFT JOIN "Order" o ON al."orderId" = o.id
            LEFT JOIN "Reader" r ON al."readerId" = r.id
            ORDER BY al."createdAt" DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get activity log by ID
exports.getActivityLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT al.*, 
            row_to_json(o.*) as "Order", 
            row_to_json(r.*) as "Reader"
            FROM "ActivityLog" al
            LEFT JOIN "Order" o ON al."orderId" = o.id
            LEFT JOIN "Reader" r ON al."readerId" = r.id
            WHERE al.id = $1
        `;
        const result = await db.query(query, [parseInt(id)]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Activity log not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get activity logs by order ID
exports.getActivityLogsByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const query = `
            SELECT al.*, 
            row_to_json(r.*) as "Reader"
            FROM "ActivityLog" al
            LEFT JOIN "Reader" r ON al."readerId" = r.id
            WHERE al."orderId" = $1
            ORDER BY al."createdAt" DESC
        `;
        const result = await db.query(query, [parseInt(orderId)]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get activity logs by reader ID
exports.getActivityLogsByReader = async (req, res) => {
    try {
        const { readerId } = req.params;
        const query = `
            SELECT al.*, 
            row_to_json(o.*) as "Order"
            FROM "ActivityLog" al
            LEFT JOIN "Order" o ON al."orderId" = o.id
            WHERE al."readerId" = $1
            ORDER BY al."createdAt" DESC
        `;
        const result = await db.query(query, [parseInt(readerId)]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new activity log
exports.createActivityLog = async (req, res) => {
    try {
        const { action, description, orderId, readerId } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const query = `
            INSERT INTO "ActivityLog" (action, description, "orderId", "readerId", "createdAt")
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *
        `;
        const values = [
            action || "NOTE",
            description,
            orderId ? parseInt(orderId) : null,
            readerId ? parseInt(readerId) : null
        ];

        const result = await db.query(query, values);
        const activityLog = result.rows[0];

        // Fetch Order and Reader to match Prisma behavior
        if (activityLog.orderId) {
            const orderRes = await db.query('SELECT * FROM "Order" WHERE id = $1', [activityLog.orderId]);
            activityLog.Order = orderRes.rows[0];
        }
        if (activityLog.readerId) {
            const readerRes = await db.query('SELECT * FROM "Reader" WHERE id = $1', [activityLog.readerId]);
            activityLog.Reader = readerRes.rows[0];
        }

        res.status(201).json(activityLog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an activity log
exports.updateActivityLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, description, orderId, readerId } = req.body;

        const query = `
            UPDATE "ActivityLog" SET
                action = $1, description = $2, "orderId" = $3, "readerId" = $4
            WHERE id = $5
            RETURNING *
        `;
        const values = [
            action,
            description,
            orderId ? parseInt(orderId) : null,
            readerId ? parseInt(readerId) : null,
            parseInt(id)
        ];

        const result = await db.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Activity log not found' });

        const activityLog = result.rows[0];

        // Fetch Order and Reader
        if (activityLog.orderId) {
            const orderRes = await db.query('SELECT * FROM "Order" WHERE id = $1', [activityLog.orderId]);
            activityLog.Order = orderRes.rows[0];
        }
        if (activityLog.readerId) {
            const readerRes = await db.query('SELECT * FROM "Reader" WHERE id = $1', [activityLog.readerId]);
            activityLog.Reader = readerRes.rows[0];
        }

        res.json(activityLog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete an activity log
exports.deleteActivityLog = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM "ActivityLog" WHERE id = $1 RETURNING id', [parseInt(id)]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Activity log not found' });
        res.json({ message: 'Activity log deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
