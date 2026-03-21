const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

// Setup multer memory storage (Untuk upload gambar)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// 🌟 RUTE PUBLIK STATIS (HARUS DI ATAS)
// ==========================================
router.get('/top-shops', productController.getTopShops);
router.get('/campuses', productController.getCampuses);
router.get('/', productController.getProducts);

// Rute Profil Penjual (Ambil semua barang milik penjual X)
router.get('/seller/:id', productController.getSellerProducts);

// ==========================================
// 🌟 RUTE PUBLIK DINAMIS (HARUS DI BAWAH)
// ==========================================
// Rute ini harus paling bawah dari deretan GET publik agar tidak menabrak rute lain
router.get('/:id', productController.getProductById);

// ==========================================
// 🔒 RUTE TERPROTEKSI (MEMBUTUHKAN LOGIN)
// ==========================================
router.post('/', protect, upload.array('images', 5), productController.createProduct);

// 🛠️ RUTE SELLER TOOLS
router.put('/:id', protect, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);
router.put('/:id/sold', protect, productController.markAsSold);

module.exports = router;