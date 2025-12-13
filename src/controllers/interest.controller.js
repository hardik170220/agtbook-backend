const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createInterest = async (req, res) => {
    try {
        const { bookId, name, mobile, email, notes } = req.body;

        // Check if reader exists, if not create one
        let reader = await prisma.reader.findUnique({
            where: { mobile },
        });

        if (!reader) {
            // Split name into first and last name
            const nameParts = name ? name.trim().split(' ') : ['Unknown'];
            const firstname = nameParts[0];
            const lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            reader = await prisma.reader.create({
                data: {
                    firstname,
                    lastname,
                    mobile,
                    email,
                },
            });
        }

        // Create interest
        const interest = await prisma.interest.create({
            data: {
                bookId: parseInt(bookId),
                readerId: reader.id,
                notes,
            },
        });

        res.status(201).json(interest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllInterests = async (req, res) => {
    try {
        const interests = await prisma.interest.findMany({
            include: {
                Book: true,
                Reader: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(interests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getInterestsByBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const interests = await prisma.interest.findMany({
            where: { bookId: parseInt(bookId) },
            include: {
                Reader: true,
            },
        });
        res.json(interests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getInterestsByReader = async (req, res) => {
    try {
        const { readerId } = req.params;
        const interests = await prisma.interest.findMany({
            where: { readerId: parseInt(readerId) },
            include: {
                Book: true,
            },
        });
        res.json(interests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
