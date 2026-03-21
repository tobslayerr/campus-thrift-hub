const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { uploadToCloudinary } = require('../middlewares/upload');

// @desc    Update Profil User (Termasuk Data Rekening & QRIS)
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id; 
        const { name, domisili, campus, bankName, bankAccount } = req.body;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        if (name !== undefined) user.name = name;
        if (domisili !== undefined) user.domisili = domisili;
        if (campus !== undefined) user.campus = campus;
        if (bankName !== undefined) user.bankName = bankName;
        if (bankAccount !== undefined) user.bankAccount = bankAccount;

        if (req.files) {
            if (req.files['avatar'] && req.files['avatar'][0]) {
                const avatarUrl = await uploadToCloudinary(req.files['avatar'][0].buffer, 'avatars');
                user.profilePicture = avatarUrl;
            }

            if (req.files['qris'] && req.files['qris'][0]) {
                const qrisUrl = await uploadToCloudinary(req.files['qris'][0].buffer, 'qris_codes');
                user.qrisUrl = qrisUrl;
            }
        }

        await user.save();

        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({ 
            success: true, 
            data: userData, 
            message: 'Profil dan data rekening berhasil diperbarui!' 
        });

    } catch (error) {
        console.error("❌ CRASH PADA UPDATE PROFILE:", error.message);
        res.status(500).json({ success: false, message: error.message });
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
        
        // PERBAIKAN FATAL: Cari semua yang BUKAN admin. 
        // Ini memastikan user lama yang field role-nya kosong tetap terbaca.
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

            // 🔥 FITUR BARU: SEMBUNYIKAN SEMUA PRODUK USER JIKA DI-BANNED
            // Kita ubah status produk menjadi 'Dihapus' agar tidak muncul di beranda
            await Product.updateMany(
                { sellerId: user._id },
                { $set: { status: 'Dihapus' } } 
            );

        } else {
            user.banReason = null;
            user.banUntil = null;

            // 🔄 OPSIONAL: KEMBALIKAN PRODUK MENJADI TERSEDIA JIKA BLOKIR DICABUT
            // Ini akan mengaktifkan kembali produk yang sebelumnya disembunyikan oleh sistem
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