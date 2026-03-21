const Product = require('../models/Product');
const { uploadToCloudinary } = require('../middlewares/upload');

exports.createProduct = async (req, res) => {
    try {
        const { title, description, price, category } = req.body;
        
        // PASTIKAN BARIS INI MENGGUNAKAN req.user.id (Bukan req.body.sellerId)
        const sellerId = req.user.id; 

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Foto produk wajib diupload!' });
        }

        // Upload ke Cloudinary
        const imageUrl = await uploadToCloudinary(req.file.buffer, 'products');

        // Simpan ke Database
        const product = await Product.create({
            sellerId,
            title,
            description,
            price,
            category,
            imageUrl
        });

        res.status(201).json({ success: true, data: product, message: 'Produk berhasil diupload!' });
    } catch (error) {
        // ERROR 500 BERASAL DARI SINI
        console.error("ERROR UPLOAD:", error.message); // Tambahkan console.log ini agar errornya terbaca jelas di terminal
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Dapatkan Semua Produk (Untuk Katalog)
// @route   GET /api/products
exports.getProducts = async (req, res) => {
    try {
        // Mengambil produk yang statusnya "Tersedia", diurutkan dari yang Premium dulu
        const products = await Product.find({ status: 'Tersedia' })
            .sort({ isPremium: -1, createdAt: -1 });
            
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Dapatkan Detail 1 Produk
// @route   GET /api/products/:id
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('sellerId', 'name');
        if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan' });
        
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};