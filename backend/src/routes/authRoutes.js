const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    verifyOTP, 
    loginUser, 
    adminLogin,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    getMe,
    updateProfile
} = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');

// Rute Pendaftaran & Login
router.post('/register', registerUser);
router.post('/verify', verifyOTP);
router.post('/login', loginUser);
router.post('/admin/login', adminLogin);

// Rute Lupa Password
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

// Rute Profil Pengguna (Hanya bisa diakses jika user sedang login / memiliki token)
router.get('/me', protect, getMe);
// Jika Anda menggunakan multer untuk upload profile picture & qris, uncomment dan tambahkan di sini:
// const { upload } = require('../middlewares/upload');
// router.put('/update-profile', protect, upload.fields([{ name: 'avatar' }, { name: 'qris' }]), updateProfile);

module.exports = router;