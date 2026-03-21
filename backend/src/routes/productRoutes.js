const express = require('express');
const router = express.Router();
const { 
    createProduct, 
    getProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct // <-- Tambahan Baru
} = require('../controllers/productController');
const { upload } = require('../middlewares/upload');
const antiFraudFilter = require('../middlewares/antiFraud');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', getProducts);
router.get('/:id', getProductById);

// UBAH: upload.single('image') menjadi upload.array('images', 5)
router.post('/', protect, upload.array('images', 5), antiFraudFilter, createProduct);
router.put('/:id', protect, upload.array('images', 5), antiFraudFilter, updateProduct);

// TAMBAHKAN: Route Hapus Barang
router.delete('/:id', protect, deleteProduct);

module.exports = router;