const express = require('express');
const router = express.Router();
// Import fungsi updateProduct yang baru dibuat
const { createProduct, getProducts, getProductById, updateProduct } = require('../controllers/productController');
const { upload } = require('../middlewares/upload');
const antiFraudFilter = require('../middlewares/antiFraud');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, upload.single('image'), antiFraudFilter, createProduct);

// TAMBAHKAN RUTE PUT UNTUK EDIT
router.put('/:id', protect, upload.single('image'), antiFraudFilter, updateProduct);

module.exports = router;