const express = require('express');
const router = express.Router();
const { getPaymentMethods, createPaymentMethod, deletePaymentMethod } = require('../controllers/paymentMethodController');
const { upload } = require('../middlewares/upload'); // <--- Tambahkan ini

router.get('/', getPaymentMethods);

// FITUR BARU: Tambahkan upload.single agar bisa menerima gambar QRIS
router.post('/', upload.single('qrImage'), createPaymentMethod);

router.delete('/:id', deletePaymentMethod);

module.exports = router;