const express = require('express');
const router = express.Router();

// PERHATIKAN: Ubah userController menjadi UserController (U besar)
const { updateProfile, getSellerProfile, getAllUsersForAdmin, banUser, toggleWishlist,
    getWishlist,
    checkWishlist } = require('../controllers/UserController');

const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/upload');

router.get('/seller/:id', getSellerProfile);

// Route Terproteksi User
router.put(
    '/profile', 
    protect, 
    upload.fields([
        { name: 'avatar', maxCount: 1 }, 
        { name: 'qris', maxCount: 1 }
    ]), 
    updateProfile
);
router.post('/wishlist/:productId', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);
router.get('/wishlist/check/:productId', protect, checkWishlist);

// Route Terproteksi Khusus Admin
router.get('/admin/all', protect, getAllUsersForAdmin);
router.put('/admin/ban/:id', protect, banUser);

module.exports = router;