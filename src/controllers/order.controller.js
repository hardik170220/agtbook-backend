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
                // Check for changes and maintain history
                const hasChanges =
                    reader.firstname !== firstname ||
                    reader.lastname !== lastname ||
                    reader.email !== email ||
                    reader.address !== address ||
                    reader.city !== city ||
                    reader.state !== state ||
                    reader.pincode !== pincode;

                if (hasChanges) {
                    // Create history record with OLD details
                    await prisma.readerHistory.create({
                        data: {
                            readerId: reader.id,
                            firstname: reader.firstname,
                            lastname: reader.lastname,
                            email: reader.email,
                            address: reader.address,
                            city: reader.city,
                            state: reader.state,
                            pincode: reader.pincode
                        }
                    });

                    // Update reader with NEW details
                    reader = await prisma.reader.update({
                        where: { id: reader.id },
                        data: {
                            firstname,
                            lastname,
                            email,
                            address,
                            city,
                            state,
                            pincode
                        }
                    });
                }
            }

            // 2. Check Stock and Prepare Ordered Books Data
            const orderedBooksData = [];

            for (const item of books) {
                const bookId = parseInt(item.bookId);
                const quantity = parseInt(item.quantity);

                const book = await prisma.book.findUnique({ where: { id: bookId } });

                if (!book) {
                    throw new Error(`Book with ID ${bookId} not found`);
                }

                // Treat null/undefined stock as 0
                const currentStock = book.stockQty || 0;

                // Determine status based on stock availability
                let bookStatus = 'NEW_ORDER'; // Default for in-stock
                if (currentStock < quantity) {
                    bookStatus = 'PENDING';
                }

                const newStock = currentStock - quantity;
                const isAvailable = newStock > 0;

                await prisma.book.update({
                    where: { id: bookId },
                    data: {
                        stockQty: newStock,
                        isAvailable: isAvailable
                    }
                });

                orderedBooksData.push({
                    bookId: bookId,
                    quantity: quantity,
                    status: bookStatus
                });
            }

            // 3. Create Order
            const order = await prisma.order.create({
                data: {
                    readerId: reader.id,
                    shippingDetails,
                    status: 'PENDING',
                    OrderedBook: {
                        create: orderedBooksData
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

exports.updateOrderedBookStatus = async (req, res) => {
    try {
        const { orderId, bookId } = req.params;
        const { status } = req.body;
        const parsedOrderId = parseInt(orderId);
        const parsedTargetId = parseInt(bookId);

        // Try to find by Book ID (Foreign Key) first
        let orderedBook = await prisma.orderedBook.findFirst({
            where: {
                orderId: parsedOrderId,
                bookId: parsedTargetId
            }
        });

        // If not found, try to find by OrderedBook ID (Primary Key)
        if (!orderedBook) {
            orderedBook = await prisma.orderedBook.findFirst({
                where: {
                    orderId: parsedOrderId,
                    id: parsedTargetId
                }
            });
        }

        if (!orderedBook) {
            return res.status(404).json({
                error: 'Ordered book not found in this order',
                debug: {
                    receivedOrderId: orderId,
                    receivedId: bookId,
                    message: 'Tried matching against both bookId (FK) and id (PK)'
                }
            });
        }

        const updated = await prisma.orderedBook.update({
            where: { id: orderedBook.id },
            data: { status }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrdersByBook = async (req, res) => {
    try {
        const { bookId } = req.params;

        // Fetch ordered books with their associated order and reader details
        // Ordered by creation date to support "priority wise" list
        const results = await prisma.orderedBook.findMany({
            where: {
                bookId: parseInt(bookId)
            },
            include: {
                Order: {
                    include: {
                        Reader: true
                    }
                }
            },
            orderBy: {
                Order: {
                    createdAt: 'asc' // Oldest orders first (priority)
                }
            }
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

