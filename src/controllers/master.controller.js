const db = require('../config/db');

// Language Controllers
exports.getAllLanguages = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM "Language"');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createLanguage = async (req, res) => {
    try {
        const { name } = req.body;
        const result = await db.query(
            'INSERT INTO "Language" (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Category Controllers
exports.getAllCategories = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM "Category"');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM "Language" WHERE id = $1', [parseInt(id)]);
        res.json({ message: "Language deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Language
exports.updateLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        const result = await db.query(
            'UPDATE "Language" SET name = $1 WHERE id = $2 RETURNING *',
            [name, parseInt(id)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Language not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Category
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        const result = await db.query(
            'UPDATE "Category" SET name = $1 WHERE id = $2 RETURNING *',
            [name, parseInt(id)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM "Category" WHERE id = $1', [parseInt(id)]);
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const result = await db.query(
            'INSERT INTO "Category" (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
