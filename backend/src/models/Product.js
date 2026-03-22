const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true }, 
    images: [{ type: String, required: true }], 
    stock: { type: Number, required: true, default: 1 },
    
    // 📈 FITUR BARU: Melacak Jumlah Dilihat (Views)
    views: { type: Number, default: 0 },
    
    status: { 
        type: String, 
        enum: [
            'Tersedia', 
            'Menunggu Pembayaran', 
            'Dana Ditahan (Siap COD)', 
            'Selesai', 
            'Terjual',  
            'Dihapus'   
        ], 
        default: 'Tersedia' 
    },
    isPremium: { type: Boolean, default: false }, 
    premiumExpiredAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);