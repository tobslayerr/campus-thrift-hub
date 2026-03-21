const express = require('express');
const router = express.Router(); // <-- PERBAIKI DI SINI (Ubah .x() menjadi .Router())
const { registerUser, verifyOTP, loginUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify', verifyOTP);
router.post('/login', loginUser);

module.exports = router;