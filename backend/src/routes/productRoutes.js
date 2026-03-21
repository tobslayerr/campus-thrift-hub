const express = require('express');
const router = express.Router();

// Pastikan import ini namanya sama persis dengan yang di-eksport controller
const { 
    createProduct, 
    getProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct 
} = require('../controllers/productController');

const { upload } = require('../middlewares/upload');
const antiFraudFilter = require('../middlewares/antiFraud');
const { protect } = require('../middlewares/authMiddleware');

// Route Publik
router.get('/', getProducts);
router.get('/:id', getProductById);

// Route Terproteksi
router.post('/', protect, upload.array('images', 5), antiFraudFilter, createProduct);
router.put('/:id', protect, upload.array('images', 5), antiFraudFilter, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;