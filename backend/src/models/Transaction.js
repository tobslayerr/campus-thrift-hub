const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, unique: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    adminFee: { type: Number, default: 0 },
    sellerIncome: { type: Number, default: 0 },
    codPin: { type: String, required: true },
    
    // 📦 FIELD PENGIRIMAN & ALAMAT
    deliveryMethod: { type: String, enum: ['COD', 'Pengiriman'], default: 'COD' },
    shippingCourier: { type: String },
    shippingResi: { type: String },
    shippingProgress: { type: String, default: 'Menunggu diproses penjual' }, // <--- FIELD BARU PENGEMASAN
    buyerAddress: { type: String },       
    buyerPhone: { type: String },         
    buyerLocationPoint: { type: String }, 
    
    status: { 
        type: String, 
        enum: [
            'Menunggu Pembayaran', 'Menunggu Verifikasi', 'Dana Ditahan (Siap COD)', 
            'Barang Dikirim', 'Selesai', 'Dana Dicairkan', 'Dibatalkan', 
            'Refund Diajukan', 'Refund Diproses', 'Refund Selesai'
        ], 
        default: 'Menunggu Verifikasi' 
    },
    proofOfPayment: { type: String, required: true },
    paymentMethod: { type: String },
    
    cancelTitle: { type: String },
    cancelReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);