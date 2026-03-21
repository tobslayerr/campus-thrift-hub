const express = require('express');
const router = express.Router();
const { createReview, getProductReview } = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createReview);
router.get('/product/:productId', getProductReview); // Route publik

module.exports = router;