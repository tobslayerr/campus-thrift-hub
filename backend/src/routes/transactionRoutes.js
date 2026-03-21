const express = require('express');
const router = express.Router();
const { getMyTransactions, checkout, updateStatus, getAllTransactions, verifyCodPin, disburseFunds } = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/upload');

// Semua rute transaksi wajib login
router.use(protect); 

router.post('/checkout', upload.single('proof'), checkout);
router.get('/', getAllTransactions); // Khusus Admin
router.put('/:id/status', updateStatus); // Khusus Admin
router.get('/my-transactions', protect, getMyTransactions);
router.post('/:id/verify-pin', protect, verifyCodPin);
router.put('/:id/disburse', protect, disburseFunds);

module.exports = router;