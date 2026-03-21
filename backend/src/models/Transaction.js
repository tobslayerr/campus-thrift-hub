const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    // STANDARISASI: Tambahkan akhiran 'Id' agar Mongoose tidak bingung
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    adminFee: { type: Number, required: true }, // Komisi 5%
    sellerIncome: { type: Number, required: true }, // Sisa 95%
    status: { 
        type: String, 
        // TAMBAHAN: 'Dana Dicairkan'
        enum: ['Menunggu Verifikasi', 'Dana Ditahan (Siap COD)', 'Selesai', 'Dana Dicairkan', 'Sengketa'], 
        default: 'Menunggu Verifikasi' 
    },
    codPin: { type: String, required: true }, // PIN 4 Digit
    proofOfPayment: { type: String } // URL Gambar Struk dari Cloudinary
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);