const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');

const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const uploadFields = upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
]);

router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.post('/bulk', bookController.createMultipleBooks);
router.post('/', uploadFields, bookController.createBook);
router.put('/:id', uploadFields, bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;
