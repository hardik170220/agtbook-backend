const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOrder = async (req, res) => {
    try {
        const { firstname, lastname, mobile, email, address, city, state, pincode, books, shippingDetails } = req.body;
        // books: [{ bookId, quantity }]

        // Use transaction to ensure data integrity
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Find or Create Reader
            let reader = await prisma.reader.findUnique({ where: { mobile } });
            if (!reader) {
                reader = await prisma.reader.create({
                    data: {
                        firstname,
                        lastname,
                        mobile,
                        email,
                        address,
                        city,
                        state,
                        pincode
                    }
                });
            } else {
                // Optional: Update reader info if provided
                if (address) await prisma.reader.update({ where: { id: reader.id }, data: { address } });
            }

            // 2. Check Stock and Update Books
            for (const item of books) {
                const bookId = parseInt(item.bookId);
                const quantity = parseInt(item.quantity);

                const book = await prisma.book.findUnique({ where: { id: bookId } });

                if (!book) {
                    throw new Error(`Book with ID ${bookId} not found`);
                }

                if (book.stockQty < quantity) {
                    throw new Error(`Insufficient stock for book "${book.title}" (ID: ${bookId}). Available: ${book.stockQty}, Requested: ${quantity}`);
                }

                const newStock = book.stockQty - quantity;
                const isAvailable = newStock > 0;

                await prisma.book.update({
                    where: { id: bookId },
                    data: {
                        stockQty: newStock,
                        isAvailable: isAvailable
                    }
                });
            }

            // 3. Create Order
            const order = await prisma.order.create({
                data: {
                    readerId: reader.id,
                    shippingDetails,
                    status: 'PENDING',
                    OrderedBook: {
                        create: books.map(book => ({
                            bookId: parseInt(book.bookId),
                            quantity: parseInt(book.quantity),
                            status: 'PENDING'
                        }))
                    },
                    ActivityLog: {
                        create: {
                            description: 'Order placed',
                            readerId: reader.id
                        }
                    }
                },
                include: {
                    OrderedBook: true
                }
            });

            return order;
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                Reader: true,
                OrderedBook: { include: { Book: true } }
            },
            orderBy: { orderDate: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: {
                Reader: true,
                OrderedBook: { include: { Book: true } },
                ActivityLog: true
            }
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, description } = req.body; // description for log

        const existingOrder = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            select: { readerId: true }
        });

        if (!existingOrder) return res.status(404).json({ error: 'Order not found' });

        const order = await prisma.order.update({
            where: { id: parseInt(id) },
            data: {
                status,
                ActivityLog: {
                    create: {
                        description: description || `Order status updated to ${status}`,
                        readerId: existingOrder.readerId
                    }
                }
            }
        });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrdersByReader = async (req, res) => {
    try {
        const { readerId } = req.params;
        const orders = await prisma.order.findMany({
            where: { readerId: parseInt(readerId) },
            include: {
                OrderedBook: { include: { Book: true } }
            },
            orderBy: { orderDate: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBookOrderStats = async (req, res) => {
    try {
        const { bookId } = req.params;

        // Find all ordered instances of this book
        const orderedBooks = await prisma.orderedBook.findMany({
            where: { bookId: parseInt(bookId) },
            include: {
                Order: {
                    include: {
                        Reader: true
                    }
                }
            }
        });

        // Calculate total quantity
        const totalQuantity = orderedBooks.reduce((sum, item) => sum + item.quantity, 0);

        // Get unique readers
        const readersMap = new Map();
        orderedBooks.forEach(item => {
            if (item.Order && item.Order.Reader) {
                readersMap.set(item.Order.Reader.id, item.Order.Reader);
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
