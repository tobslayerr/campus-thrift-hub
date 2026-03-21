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

// @desc    Update Produk (Edit Barang)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
    try {
        const { title, description, price, category } = req.body;
        let product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

        // Keamanan: Pastikan yang edit adalah pemiliknya
        if (product.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Tidak diizinkan mengedit produk ini' });
        }

        // Update teks
        if (title) product.title = title;
        if (description) product.description = description;
        if (price) product.price = price;
        if (category) product.category = category;

        // Jika user upload foto baru, ganti fotonya
        if (req.file) {
            const imageUrl = await uploadToCloudinary(req.file.buffer, 'products');
            product.imageUrl = imageUrl;
        }

        await product.save();
        res.status(200).json({ success: true, data: product, message: 'Produk berhasil diperbarui!' });
    } catch (error) {
        console.error("ERROR UPDATE PRODUCT:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};