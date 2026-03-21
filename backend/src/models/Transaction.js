const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    adminFee: { type: Number, default: 0 },
    sellerIncome: { type: Number, default: 0 },
    codPin: { type: String, required: true },
    status: { 
        type: String, 
        enum: [
            'Menunggu Pembayaran', 'Menunggu Verifikasi', 'Dana Ditahan (Siap COD)', 
            'Selesai', 'Dana Dicairkan', 'Dibatalkan', 
            'Refund Diajukan', 'Refund Diproses', 'Refund Selesai' // Status Baru
        ], 
        default: 'Menunggu Verifikasi' 
    },
    proofOfPayment: { type: String, required: true },
    paymentMethod: { type: String },
    
    // Field Baru untuk Refund
    cancelTitle: { type: String },
    cancelReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);