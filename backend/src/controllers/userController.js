const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { uploadToCloudinary } = require('../middlewares/upload');

// @desc    Update Profil User (Termasuk Data Rekening & QRIS)
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
    try {
        // Gunakan id atau _id, untuk berjaga-jaga format dari auth middleware kamu
        const userId = req.user.id || req.user._id; 
        const { name, domisili, campus, bankName, bankAccount } = req.body;

        // 1. Cari user terlebih dahulu (Lebih aman untuk validasi Mongoose)
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        // 2. Update data teks
        // Kita gunakan !== undefined agar pengguna tetap bisa menghapus rekening jika ingin
        if (name !== undefined) user.name = name;
        if (domisili !== undefined) user.domisili = domisili;
        if (campus !== undefined) user.campus = campus;
        if (bankName !== undefined) user.bankName = bankName;
        if (bankAccount !== undefined) user.bankAccount = bankAccount;

        // 3. Logika File dengan Pagar Keamanan
        // Pastikan mengakses menggunakan bracket notation ['avatar'] dari multer fields
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

        // 4. Simpan ke Database
        // Menggunakan .save() memastikan validasi custom 'this.role' berjalan normal tanpa crash!
        await user.save();

        // 5. PENYELESAIAN BUG FRONTEND:
        // Ubah document Mongoose menjadi plain object JS agar aman dikirim via JSON
        const userData = user.toObject();
        
        // Hapus password dari objek murni
        delete userData.password;

        // 6. Kirim respons yang sudah 100% bersih
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

        // PERBAIKAN DI SINI:
        // Ambil semua barang KECUALI yang statusnya sudah 'Dihapus'
        const products = await Product.find({ 
            sellerId: seller._id, 
            status: { $ne: 'Dihapus' } 
        }).sort({ createdAt: -1 });
        
        // Ambil ulasan penjual
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

exports.getAllUsersForAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });
        const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.banUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });
        
        const { isBanned, banReason, banDurationDays } = req.body; // banDurationDays = 0 untuk permanen
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
        } else {
            user.banReason = null;
            user.banUntil = null;
        }

        await user.save();
        res.status(200).json({ success: true, message: `User ${isBanned ? 'diblokir' : 'diaktifkan kembali'}.` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};