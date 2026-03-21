const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // TAMBAHAN: Menyimpan ID Transaksi agar satu transaksi hanya diulas sekali
    // Tapi jika barang dibeli lagi (transaksi baru), bisa diulas lagi.
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }, 
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: [{ type: String }] 
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);