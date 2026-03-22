const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { uploadToCloudinary } = require('../middlewares/upload');

// @desc    Update Profil User (Termasuk Data Rekening & QRIS)
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id; 
        // Tambahkan bankAccountName (Atas Nama) di destructuring req.body
        const { name, domisili, campus, bankName, bankAccount, bankAccountName } = req.body;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        // 1. Update Informasi Dasar
        if (name !== undefined) user.name = name;
        if (domisili !== undefined) user.domisili = domisili;
        if (campus !== undefined) user.campus = campus;

        // 2. Handle Upload Avatar (Terpisah dari logika rekening)
        if (req.files && req.files['avatar'] && req.files['avatar'][0]) {
            const avatarUrl = await uploadToCloudinary(req.files['avatar'][0].buffer, 'avatars');
            user.profilePicture = avatarUrl;
        }

        // 3. --- LOGIKA EKSKLUSIF: BANK VS QRIS ---
        
        // CEK APAKAH ADA UPLOAD QRIS BARU
        const isUploadingQris = req.files && req.files['qris'] && req.files['qris'][0];

        if (isUploadingQris) {
            // JIKA USER UPLOAD QRIS:
            const qrisUrl = await uploadToCloudinary(req.files['qris'][0].buffer, 'qris_codes');
            user.qrisUrl = qrisUrl;

            // Paksa hapus semua data bank (Karena memilih QRIS)
            user.bankName = null;
            user.bankAccount = null;
            user.bankAccountName = null;
        } 
        else if (bankName || bankAccount || bankAccountName) {
            // JIKA USER MENGISI DATA BANK (Dan tidak upload QRIS di request ini):
            user.bankName = bankName || user.bankName;
            user.bankAccount = bankAccount || user.bankAccount;
            user.bankAccountName = bankAccountName || user.bankAccountName;

            // Paksa hapus data QRIS (Karena memilih input Bank manual)
            user.qrisUrl = null;
        }

        await user.save();

        // Bersihkan data sensitif sebelum dikirim kembali
        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({ 
            success: true, 
            data: userData, 
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
            // Hapus dari wishlist
            user.wishlist.splice(index, 1);
            await user.save();
            return res.status(200).json({ success: true, message: 'Dihapus dari wishlist', isSaved: false });
        } else {
            // Tambahkan ke wishlist
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

        res.status(200).json({ success: true, data: user.wishlist.reverse() }); // Terbaru di atas
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