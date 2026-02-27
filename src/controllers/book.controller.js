// const db = require("../config/db");

// const transformBook = (req, book) => ({
//     ...book,
//     frontImage: book.frontImage ? `${req.protocol}://${req.get("host")}/api/books/${book.id}/image/front` : null,
//     backImage: book.backImage ? `${req.protocol}://${req.get("host")}/api/books/${book.id}/image/back` : null,
// });

// exports.getAllBooks = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const search = req.query.search || "";
//         const offset = (page - 1) * limit;

//         const {
//             languageId, categoryId, isAvailable,
//             kabatNumber, minPages, maxPages, bookSize,
//             yearAD, vikramSamvat, veerSamvat
//         } = req.query;

//         let conditions = [];
//         let values = [];

//         if (search) {
//             values.push(`%${search}%`);
//             const searchIdx = values.length;
//             let searchConditions = [
//                 `b.title ILIKE $${searchIdx}`,
//                 `b.author ILIKE $${searchIdx}`
//             ];
//             if (!isNaN(parseInt(search))) {
//                 values.push(parseInt(search));
//                 searchConditions.push(`b."bookCode" = $${values.length}`);
//             }
//             conditions.push(`(${searchConditions.join(' OR ')})`);
//         }

//         if (languageId) {
//             if (Array.isArray(languageId)) {
//                 const placeholders = languageId.map((id) => {
//                     values.push(parseInt(id));
//                     return `$${values.length}`;
//                 });
//                 conditions.push(`b."languageId" IN (${placeholders.join(',')})`);
//             } else {
//                 values.push(parseInt(languageId));
//                 conditions.push(`b."languageId" = $${values.length}`);
//             }
//         }

//         if (categoryId) {
//             if (Array.isArray(categoryId)) {
//                 const placeholders = categoryId.map((id) => {
//                     values.push(parseInt(id));
//                     return `$${values.length}`;
//                 });
//                 conditions.push(`b."categoryId" IN (${placeholders.join(',')})`);
//             } else {
//                 values.push(parseInt(categoryId));
//                 conditions.push(`b."categoryId" = $${values.length}`);
//             }
//         }

//         if (isAvailable !== undefined) {
//             values.push(isAvailable === "true" || isAvailable === true);
//             conditions.push(`b."isAvailable" = $${values.length}`);
//         }

//         if (kabatNumber) {
//             values.push(`%${kabatNumber}%`);
//             conditions.push(`CAST(b."kabatNumber" AS TEXT) ILIKE $${values.length}`);
//         }

//         if (bookSize) {
//             values.push(`%${bookSize}%`);
//             conditions.push(`b."bookSize" ILIKE $${values.length}`);
//         }

//         if (minPages) {
//             values.push(parseInt(minPages));
//             conditions.push(`b."pages" >= $${values.length}`);
//         }

//         if (maxPages) {
//             values.push(parseInt(maxPages));
//             conditions.push(`b."pages" <= $${values.length}`);
//         }

//         if (yearAD) {
//             values.push(parseInt(yearAD));
//             conditions.push(`b."yearAD" = $${values.length}`);
//         }

//         if (vikramSamvat) {
//             values.push(parseInt(vikramSamvat));
//             conditions.push(`b."vikramSamvat" = $${values.length}`);
//         }

//         if (veerSamvat) {
//             values.push(parseInt(veerSamvat));
//             conditions.push(`b."veerSamvat" = $${values.length}`);
//         }

//         const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

//         const countQuery = `SELECT COUNT(*)::int as total FROM "Book" b ${whereClause}`;
//         const totalResult = await db.query(countQuery, values);
//         const total = totalResult.rows[0].total;

//         const dataQuery = `
//             SELECT b.*, 
//             row_to_json(l.*) as "Language", 
//             row_to_json(c.*) as "Category"
//             FROM "Book" b
//             LEFT JOIN "Language" l ON b."languageId" = l.id
//             LEFT JOIN "Category" c ON b."categoryId" = c.id
//             ${whereClause}
//             ORDER BY b."createdAt" DESC
//             LIMIT $${values.length + 1} OFFSET $${values.length + 2}
//         `;

//         const dataValues = [...values, limit, offset];
//         const booksResult = await db.query(dataQuery, dataValues);

//         res.json({
//             books: booksResult.rows.map(book => transformBook(req, book)),
//             pagination: {
//                 total,
//                 page,
//                 limit,
//                 totalPages: Math.ceil(total / limit)
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// exports.getBookById = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const query = `
//             SELECT b.*, 
//             row_to_json(l.*) as "Language", 
//             row_to_json(c.*) as "Category"
//             FROM "Book" b
//             LEFT JOIN "Language" l ON b."languageId" = l.id
//             LEFT JOIN "Category" c ON b."categoryId" = c.id
//             WHERE b.id = $1
//         `;
//         const result = await db.query(query, [parseInt(id)]);
//         if (result.rows.length === 0) return res.status(404).json({ error: "Book not found" });
//         res.json(transformBook(req, result.rows[0]));
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// exports.createBook = async (req, res) => {
//     try {
//         const { title, description, stockQty, isAvailable, featured, languageId, categoryId, bookCode, kabatNumber, bookSize, author, tikakar, prakashak, sampadak, anuvadak, vishay, shreni1, shreni2, shreni3, pages, yearAD, vikramSamvat, veerSamvat, price, prakar, edition } = req.body;

//         const parseIntSafe = (v) => {
//             const parsed = parseInt(v);
//             return isNaN(parsed) ? null : parsed;
//         };

//         const frontImage = req.files && req.files["frontImage"] ? req.files["frontImage"][0].buffer : null;
//         const backImage = req.files && req.files["backImage"] ? req.files["backImage"][0].buffer : null;

//         const query = `
//             INSERT INTO "Book" (
//                 title, description, "frontImage", "backImage", "stockQty", "isAvailable", 
//                 featured, "languageId", "categoryId", "bookCode", "kabatNumber", "bookSize", 
//                 author, tikakar, prakashak, sampadak, anuvadak, vishay, 
//                 shreni1, shreni2, shreni3, pages, "yearAD", "vikramSamvat", 
//                 "veerSamvat", price, prakar, edition, "createdAt", "updatedAt"
//             ) VALUES (
//                 $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
//                 $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, NOW(), NOW()
//             ) RETURNING *
//         `;

//         const values = [
//             title, description || null, frontImage, backImage,
//             parseIntSafe(stockQty) || 0, isAvailable === "true" || isAvailable === true,
//             featured === "true" || featured === true, parseIntSafe(languageId),
//             parseIntSafe(categoryId), parseIntSafe(bookCode), parseIntSafe(kabatNumber),
//             bookSize || null, author || null, tikakar || null, prakashak || null,
//             sampadak || null, anuvadak || null, vishay || null, shreni1 || null,
//             shreni2 || null, shreni3 || null, parseIntSafe(pages), parseIntSafe(yearAD),
//             parseIntSafe(vikramSamvat), parseIntSafe(veerSamvat), parseFloat(price) || 0,
//             prakar || null, parseIntSafe(edition)
//         ];

//         const result = await db.query(query, values);
//         res.status(201).json(transformBook(req, result.rows[0]));
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// exports.updateBook = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { title, description, frontImage, backImage, stockQty, isAvailable, featured, languageId, categoryId, bookCode, kabatNumber, bookSize, author, tikakar, prakashak, sampadak, anuvadak, vishay, shreni1, shreni2, shreni3, pages, yearAD, vikramSamvat, veerSamvat, price, prakar, edition } = req.body;

//         const parseIntSafe = (v) => {
//             const parsed = parseInt(v);
//             return isNaN(parsed) ? null : parsed;
//         };

//         let frontImageBuffer = frontImage || null;
//         let backImageBuffer = backImage || null;

//         if (req.files) {
//             if (req.files["frontImage"]) {
//                 frontImageBuffer = req.files["frontImage"][0].buffer;
//             }
//             if (req.files["backImage"]) {
//                 backImageBuffer = req.files["backImage"][0].buffer;
//             }
//         }

//         // We only update images if they are provided as buffers
//         // If they are strings (like old URLs), we might need to be careful.
//         // Prisma code was setting them to null if not provided in the data.

//         const query = `
//             UPDATE "Book" SET
//                 title = $1, description = $2, "frontImage" = $3, "backImage" = $4, 
//                 "stockQty" = $5, "isAvailable" = $6, featured = $7, "languageId" = $8, 
//                 "categoryId" = $9, "bookCode" = $10, "kabatNumber" = $11, "bookSize" = $12, 
//                 author = $13, tikakar = $14, prakashak = $15, sampadak = $16, 
//                 anuvadak = $17, vishay = $18, shreni1 = $19, shreni2 = $20, 
//                 shreni3 = $21, pages = $22, "yearAD" = $23, "vikramSamvat" = $24, 
//                 "veerSamvat" = $25, price = $26, prakar = $27, edition = $28, "updatedAt" = NOW()
//             WHERE id = $29
//             RETURNING *
//         `;

//         const values = [
//             title, description || null, frontImageBuffer, backImageBuffer,
//             parseIntSafe(stockQty) ?? 0, isAvailable === "true" || isAvailable === true,
//             featured === "true" || featured === true, parseIntSafe(languageId),
//             parseIntSafe(categoryId), parseIntSafe(bookCode), parseIntSafe(kabatNumber),
//             bookSize || null, author || null, tikakar || null, prakashak || null,
//             sampadak || null, anuvadak || null, vishay || null, shreni1 || null,
//             shreni2 || null, shreni3 || null, parseIntSafe(pages), parseIntSafe(yearAD),
//             parseIntSafe(vikramSamvat), parseIntSafe(veerSamvat), parseFloat(price) || 0,
//             prakar || null, parseIntSafe(edition), parseInt(id)
//         ];

//         const result = await db.query(query, values);
//         if (result.rows.length === 0) return res.status(404).json({ error: "Book not found" });
//         res.json(transformBook(req, result.rows[0]));
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// exports.deleteBook = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const result = await db.query('DELETE FROM "Book" WHERE id = $1 RETURNING id', [parseInt(id)]);
//         if (result.rows.length === 0) return res.status(404).json({ error: "Book not found" });
//         res.json({ message: "Book deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// exports.createMultipleBooks = async (req, res) => {
//     try {
//         const books = req.body.books;

//         if (!Array.isArray(books)) {
//             return res.status(400).json({ error: "Data must be an array of books" });
//         }

//         const parseIntSafe = (v) => {
//             const parsed = parseInt(v);
//             return isNaN(parsed) ? null : parsed;
//         };

//         const getBuffer = (index, key, base64Data) => {
//             if (req.files && req.files[`books[${index}][${key}]`]) {
//                 return req.files[`books[${index}][${key}]`][0].buffer;
//             }
//             if (base64Data && typeof base64Data === 'string' && base64Data.startsWith('data:image')) {
//                 const base64String = base64Data.split(';base64,').pop();
//                 return Buffer.from(base64String, 'base64');
//             }
//             return null;
//         };

//         const createdBooks = [];
//         const errors = [];

//         for (let i = 0; i < books.length; i++) {
//             try {
//                 const item = books[i];
//                 const {
//                     bookCode, kabatNumber, bookSize, title, description,
//                     frontImage, backImage, author, tikakar, prakashak,
//                     sampadak, anuvadak, vishay, shreni1, shreni2, shreni3,
//                     pages, yearAD, vikramSamvat, veerSamvat, price, prakar,
//                     edition, isAvailable, featured, languageId, categoryId,
//                     stockQty
//                 } = item;

//                 if (!title || !bookCode) {
//                     errors.push({ index: i, error: "Missing title or bookCode" });
//                     continue;
//                 }

//                 const frontImageBuffer = getBuffer(i, 'frontImage', frontImage);
//                 const backImageBuffer = getBuffer(i, 'backImage', backImage);

//                 const query = `
//                     INSERT INTO "Book" (
//                         title, description, "frontImage", "backImage", "stockQty", "isAvailable", 
//                         featured, "languageId", "categoryId", "bookCode", "kabatNumber", "bookSize", 
//                         author, tikakar, prakashak, sampadak, anuvadak, vishay, 
//                         shreni1, shreni2, shreni3, pages, "yearAD", "vikramSamvat", 
//                         "veerSamvat", price, prakar, edition, "createdAt", "updatedAt"
//                     ) VALUES (
//                         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
//                         $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, NOW(), NOW()
//                     ) RETURNING *
//                 `;

//                 const values = [
//                     title, description || null, frontImageBuffer, backImageBuffer,
//                     parseIntSafe(stockQty) ?? 0, isAvailable === "true" || isAvailable === true,
//                     featured === "true" || featured === true, parseIntSafe(languageId),
//                     parseIntSafe(categoryId), parseIntSafe(bookCode) || 0, parseIntSafe(kabatNumber),
//                     bookSize || null, author || null, tikakar || null, prakashak || null,
//                     sampadak || null, anuvadak || null, vishay || null, shreni1 || null,
//                     shreni2 || null, shreni3 || null, parseIntSafe(pages), parseIntSafe(yearAD),
//                     parseIntSafe(vikramSamvat), parseIntSafe(veerSamvat), price ? parseFloat(price) : 0,
//                     prakar || null, parseIntSafe(edition)
//                 ];

//                 const result = await db.query(query, values);
//                 createdBooks.push(transformBook(req, result.rows[0]));
//             } catch (error) {
//                 errors.push({ index: i, error: error.message });
//             }
//         }

//         res.status(201).json({
//             message: `${createdBooks.length} books created successfully`,
//             count: createdBooks.length,
//             totalProcessed: books.length,
//             failed: errors.length,
//             createdBooks: createdBooks,
//             errors: errors.length > 0 ? errors : undefined
//         });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// exports.getBookImage = async (req, res) => {
//     try {
//         const { id, type } = req.params;
//         const column = type === 'front' ? 'frontImage' : 'backImage';
//         const query = `SELECT "${column}" as image FROM "Book" WHERE id = $1`;
//         const result = await db.query(query, [parseInt(id)]);

//         if (result.rows.length === 0) return res.status(404).json({ error: "Book not found" });

//         const image = result.rows[0].image;
//         if (!image) return res.status(404).json({ error: "Image not found" });

//         res.set('Content-Type', 'image/jpeg');
//         res.send(image);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };
const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// Helper to delete old image file from disk
const deleteImageFile = (filename) => {
    if (!filename) return;
    const filePath = path.join(__dirname, "../uploads", filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// Transform book: replace filename with full URL
const transformBook = (req, book) => ({
    ...book,
    frontImage: book.frontImage
        ? `${req.protocol}://${req.get("host")}/uploads/${book.frontImage}`
        : null,
    backImage: book.backImage
        ? `${req.protocol}://${req.get("host")}/uploads/${book.backImage}`
        : null,
});

exports.getAllBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        const {
            languageId, categoryId, isAvailable,
            kabatNumber, minPages, maxPages, bookSize,
            yearAD, vikramSamvat, veerSamvat
        } = req.query;

        let conditions = [];
        let values = [];

        if (search) {
            values.push(`%${search}%`);
            const searchIdx = values.length;
            let searchConditions = [
                `b.title ILIKE $${searchIdx}`,
                `b.author ILIKE $${searchIdx}`
            ];
            if (!isNaN(parseInt(search))) {
                values.push(parseInt(search));
                searchConditions.push(`b."bookCode" = $${values.length}`);
            }
            conditions.push(`(${searchConditions.join(' OR ')})`);
        }

        if (languageId) {
            if (Array.isArray(languageId)) {
                const placeholders = languageId.map((id) => {
                    values.push(parseInt(id));
                    return `$${values.length}`;
                });
                conditions.push(`b."languageId" IN (${placeholders.join(',')})`);
            } else {
                values.push(parseInt(languageId));
                conditions.push(`b."languageId" = $${values.length}`);
            }
        }

        if (categoryId) {
            if (Array.isArray(categoryId)) {
                const placeholders = categoryId.map((id) => {
                    values.push(parseInt(id));
                    return `$${values.length}`;
                });
                conditions.push(`b."categoryId" IN (${placeholders.join(',')})`);
            } else {
                values.push(parseInt(categoryId));
                conditions.push(`b."categoryId" = $${values.length}`);
            }
        }

        if (isAvailable !== undefined) {
            values.push(isAvailable === "true" || isAvailable === true);
            conditions.push(`b."isAvailable" = $${values.length}`);
        }

        if (kabatNumber) {
            values.push(`%${kabatNumber}%`);
            conditions.push(`CAST(b."kabatNumber" AS TEXT) ILIKE $${values.length}`);
        }

        if (bookSize) {
            values.push(`%${bookSize}%`);
            conditions.push(`b."bookSize" ILIKE $${values.length}`);
        }

        if (minPages) {
            values.push(parseInt(minPages));
            conditions.push(`b."pages" >= $${values.length}`);
        }

        if (maxPages) {
            values.push(parseInt(maxPages));
            conditions.push(`b."pages" <= $${values.length}`);
        }

        if (yearAD) {
            values.push(parseInt(yearAD));
            conditions.push(`b."yearAD" = $${values.length}`);
        }

        if (vikramSamvat) {
            values.push(parseInt(vikramSamvat));
            conditions.push(`b."vikramSamvat" = $${values.length}`);
        }

        if (veerSamvat) {
            values.push(parseInt(veerSamvat));
            conditions.push(`b."veerSamvat" = $${values.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*)::int as total FROM "Book" b ${whereClause}`;
        const totalResult = await db.query(countQuery, values);
        const total = totalResult.rows[0].total;

        const dataQuery = `
            SELECT b.*, 
            row_to_json(l.*) as "Language", 
            row_to_json(c.*) as "Category"
            FROM "Book" b
            LEFT JOIN "Language" l ON b."languageId" = l.id
            LEFT JOIN "Category" c ON b."categoryId" = c.id
            ${whereClause}
            ORDER BY b."createdAt" DESC
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `;

        const dataValues = [...values, limit, offset];
        const booksResult = await db.query(dataQuery, dataValues);

        res.json({
            books: booksResult.rows.map(book => transformBook(req, book)),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT b.*, 
            row_to_json(l.*) as "Language", 
            row_to_json(c.*) as "Category"
            FROM "Book" b
            LEFT JOIN "Language" l ON b."languageId" = l.id
            LEFT JOIN "Category" c ON b."categoryId" = c.id
            WHERE b.id = $1
        `;
        const result = await db.query(query, [parseInt(id)]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Book not found" });
        res.json(transformBook(req, result.rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createBook = async (req, res) => {
    try {
        const {
            title, description, stockQty, isAvailable, featured,
            languageId, categoryId, bookCode, kabatNumber, bookSize,
            author, tikakar, prakashak, sampadak, anuvadak, vishay,
            shreni1, shreni2, shreni3, pages, yearAD, vikramSamvat,
            veerSamvat, price, prakar, edition
        } = req.body;

        const parseIntSafe = (v) => {
            const parsed = parseInt(v);
            return isNaN(parsed) ? null : parsed;
        };

        // Save only the filename (e.g. "frontImage-1712345678.jpg")
        const frontImage = req.files?.["frontImage"]?.[0]?.filename || null;
        const backImage = req.files?.["backImage"]?.[0]?.filename || null;

        const query = `
            INSERT INTO "Book" (
                title, description, "frontImage", "backImage", "stockQty", "isAvailable", 
                featured, "languageId", "categoryId", "bookCode", "kabatNumber", "bookSize", 
                author, tikakar, prakashak, sampadak, anuvadak, vishay, 
                shreni1, shreni2, shreni3, pages, "yearAD", "vikramSamvat", 
                "veerSamvat", price, prakar, edition, "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
                $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, NOW(), NOW()
            ) RETURNING *
        `;

        const values = [
            title, description || null, frontImage, backImage,
            parseIntSafe(stockQty) ?? 0, isAvailable === "true" || isAvailable === true,
            featured === "true" || featured === true, parseIntSafe(languageId),
            parseIntSafe(categoryId), parseIntSafe(bookCode), parseIntSafe(kabatNumber),
            bookSize || null, author || null, tikakar || null, prakashak || null,
            sampadak || null, anuvadak || null, vishay || null, shreni1 || null,
            shreni2 || null, shreni3 || null, parseIntSafe(pages), parseIntSafe(yearAD),
            parseIntSafe(vikramSamvat), parseIntSafe(veerSamvat), parseFloat(price) || 0,
            prakar || null, parseIntSafe(edition)
        ];

        const result = await db.query(query, values);
        res.status(201).json(transformBook(req, result.rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, description, stockQty, isAvailable, featured,
            languageId, categoryId, bookCode, kabatNumber, bookSize,
            author, tikakar, prakashak, sampadak, anuvadak, vishay,
            shreni1, shreni2, shreni3, pages, yearAD, vikramSamvat,
            veerSamvat, price, prakar, edition
        } = req.body;

        const parseIntSafe = (v) => {
            const parsed = parseInt(v);
            return isNaN(parsed) ? null : parsed;
        };

        // Fetch existing book to get old image filenames
        const existing = await db.query(
            `SELECT "frontImage", "backImage" FROM "Book" WHERE id = $1`,
            [parseInt(id)]
        );
        if (existing.rows.length === 0) return res.status(404).json({ error: "Book not found" });

        const old = existing.rows[0];
        let frontImage = old.frontImage;
        let backImage = old.backImage;

        // If new front image uploaded, delete old file and use new filename
        if (req.files?.["frontImage"]) {
            deleteImageFile(old.frontImage);
            frontImage = req.files["frontImage"][0].filename;
        }

        // If new back image uploaded, delete old file and use new filename
        if (req.files?.["backImage"]) {
            deleteImageFile(old.backImage);
            backImage = req.files["backImage"][0].filename;
        }

        const query = `
            UPDATE "Book" SET
                title = $1, description = $2, "frontImage" = $3, "backImage" = $4, 
                "stockQty" = $5, "isAvailable" = $6, featured = $7, "languageId" = $8, 
                "categoryId" = $9, "bookCode" = $10, "kabatNumber" = $11, "bookSize" = $12, 
                author = $13, tikakar = $14, prakashak = $15, sampadak = $16, 
                anuvadak = $17, vishay = $18, shreni1 = $19, shreni2 = $20, 
                shreni3 = $21, pages = $22, "yearAD" = $23, "vikramSamvat" = $24, 
                "veerSamvat" = $25, price = $26, prakar = $27, edition = $28, "updatedAt" = NOW()
            WHERE id = $29
            RETURNING *
        `;

        const values = [
            title, description || null, frontImage, backImage,
            parseIntSafe(stockQty) ?? 0, isAvailable === "true" || isAvailable === true,
            featured === "true" || featured === true, parseIntSafe(languageId),
            parseIntSafe(categoryId), parseIntSafe(bookCode), parseIntSafe(kabatNumber),
            bookSize || null, author || null, tikakar || null, prakashak || null,
            sampadak || null, anuvadak || null, vishay || null, shreni1 || null,
            shreni2 || null, shreni3 || null, parseIntSafe(pages), parseIntSafe(yearAD),
            parseIntSafe(vikramSamvat), parseIntSafe(veerSamvat), parseFloat(price) || 0,
            prakar || null, parseIntSafe(edition), parseInt(id)
        ];

        const result = await db.query(query, values);
        res.json(transformBook(req, result.rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch image filenames before deleting
        const existing = await db.query(
            `SELECT "frontImage", "backImage" FROM "Book" WHERE id = $1`,
            [parseInt(id)]
        );
        if (existing.rows.length === 0) return res.status(404).json({ error: "Book not found" });

        const { frontImage, backImage } = existing.rows[0];

        await db.query('DELETE FROM "Book" WHERE id = $1', [parseInt(id)]);

        // Delete image files from disk
        deleteImageFile(frontImage);
        deleteImageFile(backImage);

        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBooks = async (req, res) => {
    try {
        const { ids } = req.body;
        

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: "Please provide an array of book IDs" });
        }

        // ✅ Filter out any NaN values after parsing
        const parsedIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

        if (parsedIds.length === 0) {
            return res.status(400).json({ error: "No valid integer IDs provided" });
        }

        console.log("Parsed IDs:", parsedIds); // 👈 Add this to debug

        const existing = await db.query(
            `SELECT "frontImage", "backImage" FROM "Book" WHERE id = ANY($1::int[])`,
            [parsedIds]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "No books found for the given IDs" });
        }

        await db.query('DELETE FROM "Book" WHERE id = ANY($1::int[])', [parsedIds]);

        existing.rows.forEach(({ frontImage, backImage }) => {
            deleteImageFile(frontImage);
            deleteImageFile(backImage);
        });

        res.json({
            message: `${existing.rows.length} book(s) deleted successfully`,
            deletedCount: existing.rows.length
        });
    } catch (error) {
        console.error("Bulk delete error:", error); // 👈 Full error in terminal
        res.status(500).json({ error: error.message });
    }
};


// exports.createMultipleBooks = async (req, res) => {
//     console.log('req.body:', req.body);
//     console.log('req.files:', req.files);
//     try {
//         // When sent as multipart/form-data, fields arrive as flat keys:
//         // { 'books[0][title]': 'Sample', 'books[0][bookCode]': '101', ... }
//         // We reconstruct them into an array of book objects.
//         let books = [];

//         if (req.body && req.body.books && Array.isArray(req.body.books)) {
//             // JSON body fallback (old behavior)

//             books = req.body.books;
//         } else if (req.body) {
//             // Parse flat FormData keys into array
//             const booksMap = {};
//             for (const key of Object.keys(req.body)) {
//                 const match = key.match(/^books\[(\d+)\]\[(.+)\]$/);
//                 if (match) {
//                     const index = parseInt(match[1]);
//                     const field = match[2];
//                     if (!booksMap[index]) booksMap[index] = {};
//                     booksMap[index][field] = req.body[key];
//                 }
//             }
//             books = Object.keys(booksMap)
//                 .sort((a, b) => parseInt(a) - parseInt(b))
//                 .map(k => booksMap[parseInt(k)]);
//         }

//         if (!Array.isArray(books) || books.length === 0) {
//             return res.status(400).json({ error: "Data must be an array of books" });
//         }

//         const parseIntSafe = (v) => {
//             const parsed = parseInt(v);
//             return isNaN(parsed) ? null : parsed;
//         };

//         // upload.any() returns req.files as a flat array — find by fieldname
//         const getFilename = (index, key) => {
//             const fieldKey = `books[${index}][${key}]`;
//             if (req.files && Array.isArray(req.files)) {
//                 const file = req.files.find(f => f.fieldname === fieldKey);
//                 return file ? file.filename : null;
//             }
//             if (req.files && req.files[fieldKey]) {
//                 return req.files[fieldKey][0].filename;
//             }
//             return null;
//         };

//         const createdBooks = [];
//         const errors = [];

//         for (let i = 0; i < books.length; i++) {
//             try {
//                 const item = books[i];
//                 const {
//                     bookCode, kabatNumber, bookSize, title, description,
//                     author, tikakar, prakashak, sampadak, anuvadak, vishay,
//                     shreni1, shreni2, shreni3, pages, yearAD, vikramSamvat,
//                     veerSamvat, price, prakar, edition, isAvailable, featured,
//                     languageId, categoryId, stockQty
//                 } = item;

//                 if (!title || !bookCode) {
//                     errors.push({ index: i, error: "Missing title or bookCode" });
//                     continue;
//                 }

//                 const frontImage = getFilename(i, 'frontImage');
//                 const backImage = getFilename(i, 'backImage');

//                 const query = `
//                     INSERT INTO "Book" (
//                         title, description, "frontImage", "backImage", "stockQty", "isAvailable", 
//                         featured, "languageId", "categoryId", "bookCode", "kabatNumber", "bookSize", 
//                         author, tikakar, prakashak, sampadak, anuvadak, vishay, 
//                         shreni1, shreni2, shreni3, pages, "yearAD", "vikramSamvat", 
//                         "veerSamvat", price, prakar, edition, "createdAt", "updatedAt"
//                     ) VALUES (
//                         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
//                         $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, NOW(), NOW()
//                     ) RETURNING *
//                 `;

//                 const values = [
//                     title, description || null, frontImage, backImage,
//                     parseIntSafe(stockQty) ?? 0, isAvailable === "true" || isAvailable === true,
//                     featured === "true" || featured === true, parseIntSafe(languageId),
//                     parseIntSafe(categoryId), parseIntSafe(bookCode) || 0, parseIntSafe(kabatNumber),
//                     bookSize || null, author || null, tikakar || null, prakashak || null,
//                     sampadak || null, anuvadak || null, vishay || null, shreni1 || null,
//                     shreni2 || null, shreni3 || null, parseIntSafe(pages), parseIntSafe(yearAD),
//                     parseIntSafe(vikramSamvat), parseIntSafe(veerSamvat), price ? parseFloat(price) : 0,
//                     prakar || null, parseIntSafe(edition)
//                 ];

//                 const result = await db.query(query, values);
//                 createdBooks.push(transformBook(req, result.rows[0]));
//             } catch (error) {
//                 errors.push({ index: i, error: error.message });
//             }
//         }

//         res.status(201).json({
//             message: `${createdBooks.length} books created successfully`,
//             count: createdBooks.length,
//             totalProcessed: books.length,
//             failed: errors.length,
//             createdBooks: createdBooks,
//             errors: errors.length > 0 ? errors : undefined
//         });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

exports.createMultipleBooks = async (req, res) => {
    try {
        let books = [];

        if (req.body && req.body.books && Array.isArray(req.body.books)) {
            books = req.body.books;
        } else if (req.body) {
            const booksMap = {};
            for (const key of Object.keys(req.body)) {
                const match = key.match(/^books\[(\d+)\]\[(.+)\]$/);
                if (match) {
                    const index = parseInt(match[1]);
                    const field = match[2];
                    if (!booksMap[index]) booksMap[index] = {};
                    booksMap[index][field] = req.body[key];
                }
            }
            books = Object.keys(booksMap)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(k => booksMap[parseInt(k)]);
        }

        if (!Array.isArray(books) || books.length === 0) {
            return res.status(400).json({ error: "Data must be an array of books" });
        }

        const parseIntSafe = (v) => {
            const parsed = parseInt(v);
            return isNaN(parsed) ? null : parsed;
        };

        // ✅ Find uploaded file by fieldname, return originalname (what's saved on disk)
        const getFilename = (index, key) => {
            const fieldKey = `books[${index}][${key}]`;
            if (req.files && Array.isArray(req.files)) {
                const file = req.files.find(f => f.fieldname === fieldKey);
                return file ? file.originalname : null;  // ← changed from file.filename
            }
            if (req.files && req.files[fieldKey]) {
                return req.files[fieldKey][0].originalname;  // ← changed
            }
            return null;
        };

        const createdBooks = [];
        const errors = [];

        for (let i = 0; i < books.length; i++) {
            try {
                const item = books[i];
                const {
                    bookCode, kabatNumber, bookSize, title, description,
                    author, tikakar, prakashak, sampadak, anuvadak, vishay,
                    shreni1, shreni2, shreni3, pages, yearAD, vikramSamvat,
                    veerSamvat, price, prakar, edition, isAvailable, featured,
                    languageId, categoryId, stockQty
                } = item;

                if (!title || !bookCode) {
                    errors.push({ index: i, error: "Missing title or bookCode" });
                    continue;
                }

                const frontImage = getFilename(i, 'frontImage');
                const backImage = getFilename(i, 'backImage');

                const query = `
                    INSERT INTO "Book" (
                        title, description, "frontImage", "backImage", "stockQty", "isAvailable", 
                        featured, "languageId", "categoryId", "bookCode", "kabatNumber", "bookSize", 
                        author, tikakar, prakashak, sampadak, anuvadak, vishay, 
                        shreni1, shreni2, shreni3, pages, "yearAD", "vikramSamvat", 
                        "veerSamvat", price, prakar, edition, "createdAt", "updatedAt"
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
                        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, NOW(), NOW()
                    ) RETURNING *
                `;

                const values = [
                    title, description || null, frontImage, backImage,
                    parseIntSafe(stockQty) ?? 0, isAvailable === "true" || isAvailable === true,
                    featured === "true" || featured === true, parseIntSafe(languageId),
                    parseIntSafe(categoryId), parseIntSafe(bookCode) || 0, parseIntSafe(kabatNumber),
                    bookSize || null, author || null, tikakar || null, prakashak || null,
                    sampadak || null, anuvadak || null, vishay || null, shreni1 || null,
                    shreni2 || null, shreni3 || null, parseIntSafe(pages), parseIntSafe(yearAD),
                    parseIntSafe(vikramSamvat), parseIntSafe(veerSamvat), price ? parseFloat(price) : 0,
                    prakar || null, parseIntSafe(edition)
                ];

                const result = await db.query(query, values);
                createdBooks.push(transformBook(req, result.rows[0]));
            } catch (error) {
                errors.push({ index: i, error: error.message });
            }
        }

        res.status(201).json({
            message: `${createdBooks.length} books created successfully`,
            count: createdBooks.length,
            totalProcessed: books.length,
            failed: errors.length,
            createdBooks,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Kept for backward compatibility if old route still exists
// But images are now served directly as static files via /uploads/<filename>
// Make sure you have this in your app.js / server.js:
//   app.use("/uploads", express.static(path.join(__dirname, "uploads")));
exports.getBookImage = async (req, res) => {
    try {
        const { id, type } = req.params;
        const column = type === 'front' ? 'frontImage' : 'backImage';
        const query = `SELECT "${column}" as image FROM "Book" WHERE id = $1`;
        const result = await db.query(query, [parseInt(id)]);

        if (result.rows.length === 0) return res.status(404).json({ error: "Book not found" });

        const image = result.rows[0].image;
        if (!image) return res.status(404).json({ error: "Image not found" });

        // image is now a filename string, serve the file from disk
        const filePath = path.join(__dirname, "../uploads", image);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Image file not found" });

        const ext = path.extname(image).toLowerCase();
        const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
        res.set('Content-Type', mimeTypes[ext] || 'image/jpeg');
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};