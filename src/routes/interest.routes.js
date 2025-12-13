const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interest.controller');

router.post('/', interestController.createInterest);
router.get('/', interestController.getAllInterests);
router.get('/book/:bookId', interestController.getInterestsByBook);
router.get('/reader/:readerId', interestController.getInterestsByReader);

module.exports = router;
