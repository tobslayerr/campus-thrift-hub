const Product = require('../models/Product');
const Notification = require('../models/Notification'); // Tersambung dengan fitur Notifikasi sebelumnya
const { uploadToCloudinary } = require('../middlewares/upload');

exports.createProduct = async (req, res) => {
    try {
        const { title, description, price, category, stock } = req.body;
        const sellerId = req.user.id;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Minimal 1 foto produk wajib diupload!' });
        }

        const imageUrls = await Promise.all(
            req.files.map(file => uploadToCloudinary(file.buffer, 'products'))
        );

        const product = await Product.create({
            sellerId,
            title,
            description,
            price,
            category,
            stock: stock || 1, 
            images: imageUrls,
            status: 'Tersedia'
        });

        // 🔔 Notifikasi ke Penjual
        await Notification.create({
            userId: sellerId,
            title: 'Produk Tayang! 🚀',
            message: `Barang "${title}" berhasil diunggah dan tayang di marketplace.`,
            type: 'SYSTEM'
        });

        res.status(201).json({ success: true, data: product, message: 'Produk berhasil diupload!' });
    } catch (error) {
        console.error("ERROR UPLOAD:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const { category } = req.query;
        let query = { status: { $ne: 'Dihapus' } }; 
        
        if (category && category !== 'Semua') {
            query.category = category;
        }

        const products = await Product.find(query)
            .populate('sellerId', 'name campus profilePicture isVerified isBanned') // 👈 TAMBAHKAN isBanned
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, status: { $ne: 'Dihapus' } })
            .populate('sellerId', 'name profilePicture campus rating domisili isVerified lastActive');
            
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
            if (product.stock > 0) {
                product.status = 'Tersedia';
            } else if (product.stock <= 0) {
                product.status = 'Terjual';
            }
        }

        let existingImages = req.body.existingImages || [];
        if (typeof existingImages === 'string') existingImages = [existingImages]; 

        let newImageUrls = [];
        if (req.files && req.files.length > 0) {
            newImageUrls = await Promise.all(
                req.files.map(file => uploadToCloudinary(file.buffer, 'products'))
            );
        }

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

        const isAdmin = req.user.role === 'admin';
        const isOwner = product.sellerId.toString() === req.user.id;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Tidak diizinkan' });
        }

        product.status = 'Dihapus'; // Soft delete
        await product.save();

        res.status(200).json({ success: true, message: 'Barang berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};