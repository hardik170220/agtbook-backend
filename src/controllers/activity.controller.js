const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all activity logs
exports.getAllActivityLogs = async (req, res) => {
    try {
        const activityLogs = await prisma.activityLog.findMany({
            include: {
                Order: true,
                Reader: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(activityLogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get activity log by ID
exports.getActivityLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const activityLog = await prisma.activityLog.findUnique({
            where: { id: parseInt(id) },
            include: {
                Order: true,
                Reader: true,
            },
        });
        if (!activityLog) return res.status(404).json({ error: 'Activity log not found' });
        res.json(activityLog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get activity logs by order ID
exports.getActivityLogsByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const activityLogs = await prisma.activityLog.findMany({
            where: { orderId: parseInt(orderId) },
            include: {
                Reader: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(activityLogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get activity logs by reader ID
exports.getActivityLogsByReader = async (req, res) => {
    try {
        const { readerId } = req.params;
        const activityLogs = await prisma.activityLog.findMany({
            where: { readerId: parseInt(readerId) },
            include: {
                Order: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(activityLogs);
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

        const activityLog = await prisma.activityLog.create({
            data: {
                action: action || "NOTE",
                description,
                orderId: orderId ? parseInt(orderId) : null,
                readerId: readerId ? parseInt(readerId) : null,
            },
            include: {
                Order: true,
                Reader: true,
            }
        });
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

        const activityLog = await prisma.activityLog.update({
            where: { id: parseInt(id) },
            data: {
                action,
                description,
                orderId: orderId ? parseInt(orderId) : null,
                readerId: readerId ? parseInt(readerId) : null,
            },
            include: {
                Order: true,
                Reader: true,
            }
        });
        res.json(activityLog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete an activity log
exports.deleteActivityLog = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.activityLog.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Activity log deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
