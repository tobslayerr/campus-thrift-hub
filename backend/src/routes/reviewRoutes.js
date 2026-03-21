const express = require('express');
const router = express.Router();
const { createReview, getProductReviews } = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/upload'); // Panggil multer

// TAMBAHKAN upload.array('images', 5) -> Maksimal 5 foto per ulasan
router.post('/', protect, upload.array('images', 5), createReview);
router.get('/product/:productId', getProductReviews);

module.exports = router;