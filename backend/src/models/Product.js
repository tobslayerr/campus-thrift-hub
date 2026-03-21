const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    
    // PERUBAHAN 1: Kategori dibuat dinamis
    // Dulu ada enum: ['Buku', ...]. Sekarang dihapus agar bisa menerima 
    // nama kategori apapun yang dikirim dari database (settingan Admin).
    category: { type: String, required: true }, 
    
    // PERUBAHAN 2: Mendukung Banyak Gambar (Multiple Image)
    // Diubah dari `imageUrl: { type: String }` menjadi array of strings.
    // Index ke-0 nantinya otomatis dijadikan Thumbnail di frontend.
    images: [{ type: String, required: true }], 
    
    // PERUBAHAN 3: Fitur Stok Barang
    stock: { type: Number, required: true, default: 1 },
    
    status: { 
        type: String, 
        // PERUBAHAN 4: Penambahan status 'Terjual' dan 'Dihapus'
        enum: [
            'Tersedia', 
            'Menunggu Pembayaran', 
            'Dana Ditahan (Siap COD)', 
            'Selesai', 
            'Terjual',  // Muncul saat stok = 0
            'Dihapus'   // Soft-delete agar riwayat transaksi tidak error
        ], 
        default: 'Tersedia' 
    },
    isPremium: { type: Boolean, default: false }, // Fitur Listing Premium
    premiumExpiredAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);