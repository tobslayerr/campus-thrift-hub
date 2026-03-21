const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById } = require('../controllers/productController');
const { upload } = require('../middlewares/upload');
const antiFraudFilter = require('../middlewares/antiFraud');
const { protect } = require('../middlewares/authMiddleware'); // Import ini

router.get('/', getProducts);
router.get('/:id', getProductById);

// Tambahkan "protect" di urutan pertama
router.post('/', protect, upload.single('image'), antiFraudFilter, createProduct);

module.exports = router;