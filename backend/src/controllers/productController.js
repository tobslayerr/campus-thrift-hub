const Product = require('../models/Product');
const Notification = require('../models/Notification'); // Tersambung dengan fitur Notifikasi sebelumnya
const { uploadToCloudinary } = require('../middlewares/upload');
const User = require('../models/User');

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
        const { category, search, campus, minRating, page = 1, limit = 12 } = req.query;

        let query = { status: 'Tersedia', stock: { $gt: 0 } };
        
        // Filter Kategori
        if (category && category !== 'Semua') query.category = category;
        
        // Filter Search Keyword
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter Kampus & Rating Toko (Harus mencari User/Seller terlebih dahulu)
        if (campus || minRating) {
            let sellerQuery = { isBanned: false };
            if (campus && campus !== 'Semua Kampus') {
                sellerQuery.campus = { $regex: campus, $options: 'i' };
            }
            if (minRating) {
                sellerQuery.rating = { $gte: Number(minRating) };
            }
            
            const sellers = await User.find(sellerQuery).select('_id');
            const sellerIds = sellers.map(s => s._id);
            query.sellerId = { $in: sellerIds };
        }

        // Pagination Logic
        const skip = (Number(page) - 1) * Number(limit);

        const products = await Product.find(query)
            .populate('sellerId', 'name campus profilePicture isVerified isBanned rating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
            
        const total = await Product.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            count: products.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            data: products 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getTopShops = async (req, res) => {
    try {
        // Algoritma: Rating dikali jumlah ulasan (atau fallback ke 1 jika belum ada field jumlah ulasan)
        const topSellers = await User.aggregate([
            { $match: { isBanned: false } },
            { $addFields: { 
                score: { 
                    $multiply: [ 
                        { $ifNull: ["$rating", 0] }, 
                        { $ifNull: ["$reviewsCount", { $ifNull: ["$numReviews", 1] }] } 
                    ] 
                } 
            }},
            { $sort: { score: -1, rating: -1 } },
            { $limit: 5 }
        ]);

        const result = [];
        for (const seller of topSellers) {
            // Ambil maksimal 5 produk tersedia dari tiap seller
            const products = await Product.find({ sellerId: seller._id, status: 'Tersedia', stock: { $gt: 0 } })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('sellerId', 'name campus profilePicture isVerified rating');
            
            if (products.length > 0) {
                result.push({
                    seller: {
                        _id: seller._id,
                        name: seller.name,
                        campus: seller.campus,
                        profilePicture: seller.profilePicture,
                        rating: seller.rating || 0,
                        isVerified: seller.isVerified
                    },
                    products: products
                });
            }
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getCampuses = async (req, res) => {
    try {
        const campuses = await User.distinct('campus', { isBanned: false });
        const validCampuses = campuses.filter(c => c && c.trim() !== '').sort();
        res.status(200).json({ success: true, data: validCampuses });
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

// FITUR: Hapus Barang (Soft Delete)
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

// ==========================================
// 🛠️ FITUR TAMBAHAN UNTUK SELLER TOOLS
// ==========================================

// @desc    Ambil Semua Produk Milik Seller Tertentu (Untuk Halaman Profil Toko)
exports.getSellerProducts = async (req, res) => {
    try {
        // Ambil semua produk penjual KECUALI yang sudah di-soft delete ('Dihapus')
        const products = await Product.find({ sellerId: req.params.id, status: { $ne: 'Dihapus' } })
            .populate('sellerId', 'name campus profilePicture isVerified')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Tandai Barang Laku Manual (Misal laku dibeli teman di luar aplikasi)
exports.markAsSold = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });

        if (product.sellerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Akses Ditolak! Anda bukan pemilik produk ini.' });
        }

        // Set status menjadi Terjual dan kosongkan stok
        product.status = 'Terjual';
        product.stock = 0;
        await product.save();

        res.status(200).json({ success: true, data: product, message: 'Barang berhasil ditandai sebagai Terjual.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};