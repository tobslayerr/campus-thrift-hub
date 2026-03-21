const express = require('express');
const router = express.Router();

// PERHATIKAN: Ubah userController menjadi UserController (U besar)
const { updateProfile, getSellerProfile, getAllUsersForAdmin, banUser } = require('../controllers/UserController');

const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/upload');

router.get('/seller/:id', getSellerProfile);

// Route Terproteksi menggunakan .fields() agar bisa upload banyak file
router.put(
    '/profile', 
    protect, 
    upload.fields([
        { name: 'avatar', maxCount: 1 }, 
        { name: 'qris', maxCount: 1 }
    ]), 
    updateProfile
);

router.get('/admin/all', protect, getAllUsersForAdmin);

router.put('/admin/ban/:id', protect, banUser);

module.exports = router;