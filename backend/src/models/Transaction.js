const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    adminFee: { type: Number, required: true },
    sellerIncome: { type: Number, required: true },
    proofOfPayment: { type: String, required: true },
    codPin: { type: String, required: true },
    
    // 👇 PASTIKAN BARIS INI ADA DI DALAM FILE KAMU 👇
    paymentMethod: { type: String, default: 'Transaksi Lama' },
    
    status: {
        type: String,
        enum: ['Menunggu Verifikasi', 'Dana Ditahan (Siap COD)', 'Selesai', 'Sengketa', 'Dana Dicairkan'],
        default: 'Menunggu Verifikasi'
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);