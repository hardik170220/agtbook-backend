const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

<<<<<<< HEAD

=======
>>>>>>> 64231013ff1c6a06b55ca4a8d3299151624886dd
exports.getAllBooks = async (req, res) => {
    try {
        const books = await prisma.book.findMany({
            include: {
                Language: true,
                Category: true,
            },
        });
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        const book = await prisma.book.findUnique({
            where: { id: parseInt(id) },
            include: {
                Language: true,
                Category: true,
            },
        });
        if (!book) return res.status(404).json({ error: 'Book not found' });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createBook = async (req, res) => {
    try {
        const { title, description, frontImage, backImage, stockQty, isAvailable, featured, languageId, categoryId, bookCode, kabatNumber, bookSize, author, tikakar, prakashak, sampadak, anuvadak, vishay, shreni1, shreni2, shreni3, pages, yearAD, vikramSamvat, veerSamvat, price, prakar, edition } = req.body;

        if (!title) return res.status(400).json({ error: "Title is required" });
        if (!bookCode) return res.status(400).json({ error: "bookCode is required" });

        const parseIntSafe = (v) => {
            const parsed = parseInt(v);
            return isNaN(parsed) ? null : parsed;
        };

        const book = await prisma.book.create({
            data: {
                title,
                description: description || null,
                frontImage: (req.files && req.files['frontImage']) ? `${req.protocol}://${req.get('host')}/uploads/${req.files['frontImage'][0].filename}` : (frontImage || null),
                backImage: (req.files && req.files['backImage']) ? `${req.protocol}://${req.get('host')}/uploads/${req.files['backImage'][0].filename}` : (backImage || null),
                stockQty: stockQty ? parseInt(stockQty) : 0,
                isAvailable: isAvailable === 'true' || isAvailable === true,
                featured: featured === 'true' || featured === true,
                languageId: languageId ? parseInt(languageId) : null,
                categoryId: categoryId ? parseInt(categoryId) : null,
                bookCode: parseInt(bookCode),

                // Optional fields
                kabatNumber: kabatNumber ? parseInt(kabatNumber) : null,
                bookSize: bookSize || null,
                author: author || null,
                tikakar: tikakar || null,
                prakashak: prakashak || null,
                sampadak: sampadak || null,
                anuvadak: anuvadak || null,
                vishay: vishay || null,
                shreni1: shreni1 || null,
                shreni2: shreni2 || null,
                shreni3: shreni3 || null,
                pages: pages ? parseInt(pages) : null,
                yearAD: yearAD ? parseInt(yearAD) : null,
                vikramSamvat: vikramSamvat ? parseInt(vikramSamvat) : null,
                veerSamvat: veerSamvat ? parseInt(veerSamvat) : null,
                price: price ? parseFloat(price) : null,
                prakar: prakar || null,
                edition: edition ? parseInt(edition) : null
            },
        });
        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, frontImage, backImage, stockQty, isAvailable, featured, languageId, categoryId } = req.body;
        const book = await prisma.book.update({
            where: { id: parseInt(id) },
            data: {
                title,
                description,
                frontImage: (req.files && req.files['frontImage']) ? `${req.protocol}://${req.get('host')}/uploads/${req.files['frontImage'][0].filename}` : frontImage,
                backImage: (req.files && req.files['backImage']) ? `${req.protocol}://${req.get('host')}/uploads/${req.files['backImage'][0].filename}` : backImage,
                stockQty: parseInt(stockQty),
                isAvailable: isAvailable === 'true' || isAvailable === true,
                featured: featured === 'true' || featured === true,
                languageId: parseInt(languageId),
                categoryId: parseInt(categoryId),
            },
        });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.book.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
