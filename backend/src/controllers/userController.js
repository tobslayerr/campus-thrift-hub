const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction'); 
const { uploadToCloudinary } = require('../middlewares/upload');

// @desc    Update Profil User (Termasuk Data Rekening & QRIS)
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id; 
        const { name, domisili, campus, bankName, bankAccount, bankAccountName } = req.body;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        // 1. Update Informasi Dasar
        if (name !== undefined) user.name = name;
        if (domisili !== undefined) user.domisili = domisili;
        if (campus !== undefined) user.campus = campus;

        // 2. Handle Upload Avatar
        if (req.files && req.files['avatar'] && req.files['avatar'][0]) {
            const avatarUrl = await uploadToCloudinary(req.files['avatar'][0].buffer, 'avatars');
            user.profilePicture = avatarUrl;
        }

        // 3. --- LOGIKA EKSKLUSIF: BANK VS QRIS ---
        const isUploadingQris = req.files && req.files['qris'] && req.files['qris'][0];

        if (isUploadingQris) {
            const qrisUrl = await uploadToCloudinary(req.files['qris'][0].buffer, 'qris_codes');
            user.qrisUrl = qrisUrl;
            user.bankName = null;
            user.bankAccount = null;
            user.bankAccountName = null;
        } 
        else if (bankName || bankAccount || bankAccountName) {
            user.bankName = bankName || user.bankName;
            user.bankAccount = bankAccount || user.bankAccount;
            user.bankAccountName = bankAccountName || user.bankAccountName;
            user.qrisUrl = null;
        }

        await user.save();

        // 🌟 PERBAIKAN FATAL BUG STATE: 
        // Mengemas object secara manual agar properti '_id' dipetakan menjadi 'id'.
        // Ini memastikan Frontend tidak kehilangan properti 'user.id' setelah update profil.
        const normalizedUserData = {
            id: user._id, 
            name: user.name,
            email: user.email,
            role: user.role,
            campus: user.campus,
            domisili: user.domisili,
            profilePicture: user.profilePicture,
            bankName: user.bankName,
            bankAccount: user.bankAccount,
            bankAccountName: user.bankAccountName, 
            qrisUrl: user.qrisUrl
        };

        res.status(200).json({ 
            success: true, 
            data: normalizedUserData, 
            message: 'Profil dan metode pencairan dana berhasil diperbarui!' 
        });

    } catch (error) {
        console.error("❌ CRASH PADA UPDATE PROFILE:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle (Tambah/Hapus) Wishlist
// @route   POST /api/users/wishlist/:productId
exports.toggleWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        const index = user.wishlist.indexOf(productId);
        if (index > -1) {
            user.wishlist.splice(index, 1);
            await user.save();
            return res.status(200).json({ success: true, message: 'Dihapus dari wishlist', isSaved: false });
        } else {
            user.wishlist.push(productId);
            await user.save();
            return res.status(200).json({ success: true, message: 'Disimpan ke wishlist', isSaved: true });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get Semua Wishlist Saya
// @route   GET /api/users/wishlist
exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).populate({
            path: 'wishlist',
            populate: [
                { path: 'sellerId', select: 'name campus rating profilePicture isVerified' },
                { path: 'category', select: 'name' }
            ]
        });

        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        res.status(200).json({ success: true, data: user.wishlist.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Cek status apakah barang ini ada di Wishlist
// @route   GET /api/users/wishlist/check/:productId
exports.checkWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const isSaved = user.wishlist.includes(req.params.productId);
        res.status(200).json({ success: true, isSaved });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Ambil Profil Publik Penjual + Barang Jualannya
// @route   GET /api/users/seller/:id
exports.getSellerProfile = async (req, res) => {
    try {
        const seller = await User.findById(req.params.id).select('-password -email -isVerified');
        if (!seller) return res.status(404).json({ message: 'Penjual tidak ditemukan' });

        const products = await Product.find({ 
            sellerId: seller._id, 
            status: { $ne: 'Dihapus' } 
        }).sort({ createdAt: -1 });
        
        const reviews = await Review.find({ sellerId: seller._id })
            .populate('buyerId', 'name profilePicture campus')
            .populate('productId', 'title imageUrl images')
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            data: { profile: seller, products, reviews } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Ambil Semua Pengguna Untuk Tabel Admin
// @route   GET /api/users/admin/all
exports.getAllUsersForAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });
        
        const users = await User.find({ role: { $ne: 'admin' } })
                                .select('-password')
                                .sort({ createdAt: -1 });
                                
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Blokir atau Buka Blokir Pengguna (Admin Only)
// @route   PUT /api/users/admin/ban/:id
exports.banUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });
        
        const { isBanned, banReason, banDurationDays } = req.body; 
        const user = await User.findById(req.params.id);
        
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        user.isBanned = isBanned;
        
        if (isBanned) {
            user.banReason = banReason;
            if (banDurationDays > 0) {
                const banDate = new Date();
                banDate.setDate(banDate.getDate() + Number(banDurationDays));
                user.banUntil = banDate;
            } else {
                user.banUntil = null; // Permanen
            }

            await Product.updateMany(
                { sellerId: user._id },
                { $set: { status: 'Dihapus' } } 
            );

        } else {
            user.banReason = null;
            user.banUntil = null;

            await Product.updateMany(
                { sellerId: user._id, status: 'Dihapus' },
                { $set: { status: 'Tersedia' } }
            );
        }

        await user.save();
        res.status(200).json({ success: true, message: `User ${isBanned ? 'diblokir' : 'diaktifkan kembali'}.` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// =================================================================
// 📈 GET SELLER ANALYTICS
// =================================================================
exports.getSellerAnalytics = async (req, res) => {
    try {
        const sellerId = req.user?.id || req.user?._id; 
        
        if (!sellerId) {
            return res.status(401).json({ success: false, message: 'User tidak terautentikasi.' });
        }

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonthTransactions = await Transaction.find({
            sellerId: sellerId,
            status: { $in: ['Selesai', 'Dana Dicairkan'] },
            updatedAt: { $gte: startOfMonth }
        }).lean();

        const totalRevenueThisMonth = thisMonthTransactions.reduce((sum, trx) => {
            const amount = Number(trx.sellerIncome) || Number(trx.price) || 0;
            return sum + amount;
        }, 0);

        const products = await Product.find({ sellerId: sellerId }).lean();
        
        const totalViews = products.reduce((sum, p) => {
            return sum + (Number(p.views) || 0);
        }, 0);
        
        const activeProducts = products.filter(p => p.status === 'Tersedia').length;
        const soldProducts = products.filter(p => p.status === 'Terjual' || p.status === 'Selesai').length;

        const topViewedProducts = await Product.find({ sellerId: sellerId, status: { $ne: 'Dihapus' } })
            .sort({ views: -1 })
            .limit(5)
            .select('title views images price status')
            .lean();

        res.status(200).json({
            success: true,
            data: {
                totalRevenueThisMonth,
                totalViews,
                activeProducts,
                soldProducts,
                topViewedProducts: topViewedProducts || []
            }
        });
    } catch (error) {
        console.error("🔥 CRASH PADA ANALYTICS:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};