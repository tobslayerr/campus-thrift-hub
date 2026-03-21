const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/upload');
const antiFraudFilter = require('../middlewares/antiFraud');

// Rute Pembeli
router.post('/checkout', protect, upload.single('proofOfPayment'), antiFraudFilter, transactionController.checkout);
router.get('/my-transactions', protect, transactionController.getMyTransactions);
router.post('/:id/verify-pin', protect, transactionController.verifyCodPin);

// Rute Khusus Admin
router.get('/', protect, transactionController.getAllTransactions);
router.put('/:id/status', protect, transactionController.updateStatus); 
router.put('/:id/disburse', protect, transactionController.disburseFunds);

// Rute Refund
router.post('/:id/refund', protect, transactionController.requestRefund);
router.put('/:id/refund/process', protect, transactionController.processRefund);
router.put('/:id/refund/complete', protect, transactionController.completeRefund);

module.exports = router;