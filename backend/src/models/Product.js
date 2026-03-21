const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, enum: ['Buku', 'Elektronik', 'Fashion', 'Lainnya'], required: true },
    imageUrl: { type: String, required: true }, // URL dari Cloudinary
    status: { 
        type: String, 
        enum: ['Tersedia', 'Menunggu Pembayaran', 'Dana Ditahan (Siap COD)', 'Selesai'], 
        default: 'Tersedia' 
    },
    isPremium: { type: Boolean, default: false }, // Fitur Listing Premium
    premiumExpiredAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);