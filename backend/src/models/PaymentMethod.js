const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    bankName: { type: String, required: true }, // Contoh: BCA, GOPAY, QRIS
    accountNumber: { type: String, required: true }, // Contoh: 8291-1234-56
    ownerName: { type: String, required: true }, // Contoh: Admin Campus Thrift
    // FITUR BARU: Kolom untuk menyimpan URL gambar QRIS
    qrImageUrl: { type: String, default: null } 
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);