const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/upload');
const antiFraudFilter = require('../middlewares/antiFraud');

// Rute Pembeli & Transaksi Umum
router.post('/checkout', protect, upload.single('proofOfPayment'), antiFraudFilter, transactionController.checkout);
router.get('/my-transactions', protect, transactionController.getMyTransactions);
router.post('/:id/verify-pin', protect, transactionController.verifyCodPin); // COD

// 📦 RUTE PENGIRIMAN
router.put('/:id/shipping-progress', protect, transactionController.updateShippingProgress); // Update status kemas
router.put('/:id/ship', protect, transactionController.shipItem); // Input resi final
router.put('/:id/confirm-delivery', protect, transactionController.confirmDelivery); // Pembeli konfirmasi barang sampai

// Rute Khusus Admin
router.get('/', protect, transactionController.getAllTransactions);
router.put('/:id/status', protect, transactionController.updateStatus); 
router.put('/:id/disburse', protect, transactionController.disburseFunds);

// Rute Refund
router.post('/:id/refund', protect, transactionController.requestRefund);
router.put('/:id/refund/process', protect, transactionController.processRefund);
router.put('/:id/refund/complete', protect, transactionController.completeRefund);

module.exports = router;