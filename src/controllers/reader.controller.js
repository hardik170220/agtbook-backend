const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllReaders = async (req, res) => {
    try {
        const readers = await prisma.reader.findMany({
            include: {
                _count: {
                    select: { Order: true }
                }
            },
            orderBy: { createdat: 'desc' }
        });
        res.json(readers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReaderById = async (req, res) => {
    try {
        const { id } = req.params;
        const reader = await prisma.reader.findUnique({
            where: { id: parseInt(id) },
            include: {
                Order: {
                    include: {
                        OrderedBook: {
                            include: { Book: true }
                        }
                    }
                }
            }
        });
        if (!reader) return res.status(404).json({ error: 'Reader not found' });
        res.json(reader);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createReader = async (req, res) => {
    try {
        const { firstname, lastname, mobile, email, address, isactive } = req.body;
        const reader = await prisma.reader.create({
            data: {
                firstname,
                lastname,
                mobile,
                email,
                address,
                isactive: isactive === undefined ? true : isactive
            }
        });
        res.status(201).json(reader);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateReader = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstname, lastname, mobile, email, address, isactive } = req.body;
        const reader = await prisma.reader.update({
            where: { id: parseInt(id) },
            data: {
                firstname,
                lastname,
                mobile,
                email,
                address,
                isactive
            }
        });
        res.json(reader);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteReader = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.reader.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Reader deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
