const Product = require('../models/Product');
const { uploadToCloudinary } = require('../middlewares/upload');

exports.createProduct = async (req, res) => {
    try {
        const { title, description, price, category, stock } = req.body;
        const sellerId = req.user.id;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Minimal 1 foto produk wajib diupload!' });
        }

        // UBAH: Upload banyak file (Array) ke Cloudinary
        const imageUrls = await Promise.all(
            req.files.map(file => uploadToCloudinary(file.buffer, 'products'))
        );

        const product = await Product.create({
            sellerId,
            title,
            description,
            price,
            category,
            stock: stock || 1, // Default 1 jika tidak diisi
            images: imageUrls // Simpan array gambar
        });

        res.status(201).json({ success: true, data: product, message: 'Produk berhasil diupload!' });
    } catch (error) {
        console.error("ERROR UPLOAD:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        // HANYA Tampilkan yang 'Tersedia'. Yang 'Dihapus' / 'Terjual' tidak akan muncul di marketplace
        const products = await Product.find({ status: 'Tersedia' })
            .sort({ isPremium: -1, createdAt: -1 });
            
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        // Abaikan barang yang sudah Dihapus
        const product = await Product.findOne({ _id: req.params.id, status: { $ne: 'Dihapus' } }).populate('sellerId', 'name profilePicture campus rating');
        if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan' });
        
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { title, description, price, category, stock } = req.body;
        let product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

        if (product.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Tidak diizinkan mengedit produk ini' });
        }

        if (title) product.title = title;
        if (description) product.description = description;
        if (price) product.price = price;
        if (category) product.category = category;
       if (stock !== undefined) {
            product.stock = stock;
            // Jika penjual mengisi stok lebih dari 0, paksa statusnya kembali jadi Tersedia
            if (product.stock > 0) {
                product.status = 'Tersedia';
            } else if (product.stock <= 0) {
                product.status = 'Terjual';
            }
        }

        // LOGIKA GAMBAR BARU & LAMA
        let existingImages = req.body.existingImages || [];
        if (typeof existingImages === 'string') existingImages = [existingImages]; // Jika hanya 1 gambar lama, ubah ke array

        let newImageUrls = [];
        if (req.files && req.files.length > 0) {
            newImageUrls = await Promise.all(
                req.files.map(file => uploadToCloudinary(file.buffer, 'products'))
            );
        }

        // Gabungkan gambar lama yang dipertahankan dengan gambar baru yang diupload
        product.images = [...existingImages, ...newImageUrls];

        if (product.images.length === 0) {
            return res.status(400).json({ success: false, message: 'Barang minimal harus memiliki 1 gambar!' });
        }

        await product.save();
        res.status(200).json({ success: true, data: product, message: 'Produk berhasil diperbarui!' });
    } catch (error) {
        console.error("ERROR UPDATE PRODUCT:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// FITUR BARU: Hapus Barang (Soft Delete)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });

        if (product.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Tidak diizinkan' });
        }

        product.status = 'Dihapus'; // Soft delete agar tidak merusak history transaksi
        await product.save();

        res.status(200).json({ success: true, message: 'Barang berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};