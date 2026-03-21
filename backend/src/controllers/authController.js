const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const { uploadToCloudinary } = require('../middlewares/upload'); // Import helper upload

// @desc    Registrasi User Baru
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, domisili, campus } = req.body;

        if (!name || !email || !password || !domisili || !campus) {
            return res.status(400).json({ message: 'Semua kolom wajib diisi!' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email sudah terdaftar!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // OTP 6 Digit
        const otpToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            domisili,
            campus,
            verificationToken: otpToken
        });

        const message = `
            <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #FFD700;">Selamat datang di Campus Thrift Hub!</h2>
                <p>Halo <strong>${name}</strong>,</p>
                <p>Gunakan kode OTP di bawah ini untuk memverifikasi akun Anda:</p>
                <div style="background: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
                    ${otpToken}
                </div>
            </div>
        `;
        
        try {
            await sendEmail({ 
                email: user.email, 
                subject: 'Verifikasi Akun Campus Thrift Hub', 
                message 
            });
            res.status(201).json({ success: true, message: 'Registrasi berhasil. Cek email untuk OTP.' });
        } catch (err) {
            res.status(201).json({ success: true, message: 'Registrasi berhasil, tapi gagal kirim email.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Verifikasi OTP
// @route   POST /api/auth/verify
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
        if (user.verificationToken !== otp) return res.status(400).json({ message: 'OTP Salah' });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Verifikasi berhasil!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Login User
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'Email tidak ditemukan!' });
        if (!user.isVerified) return res.status(403).json({ message: 'Verifikasi akun dahulu!' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Password salah!' });

        // =========================================================
        // 🔥 PENGECEKAN STATUS BANNED SEBELUM MEMBERIKAN TOKEN 🔥
        // =========================================================
        if (user.isBanned) {
            const now = new Date();
            
            // Cek apakah ban permanen (!user.banUntil) ATAU masa ban belum habis
            if (!user.banUntil || new Date(user.banUntil) > now) {
                return res.status(403).json({ 
                    success: false, 
                    isBanned: true, 
                    banReason: user.banReason, 
                    banUntil: user.banUntil,
                    message: 'Akun Anda telah diblokir oleh Admin.' 
                });
            } else {
                // Masa hukuman sudah lewat (Expired), lepaskan ban secara otomatis
                user.isBanned = false;
                user.banReason = null;
                user.banUntil = null;
                await user.save();
            }
        }
        // =========================================================

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                campus: user.campus,
                domisili: user.domisili,
                profilePicture: user.profilePicture,
                bankName: user.bankName,
                bankAccount: user.bankAccount,
                qrisUrl: user.qrisUrl
            },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get Current User Data
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update Profile & Rekening (Privat)
// @route   PUT /api/auth/update-profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, campus, domisili, bankName, bankAccount } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        // Update data teks
        user.name = name || user.name;
        user.campus = campus || user.campus;
        user.domisili = domisili || user.domisili;
        user.bankName = bankName || user.bankName;
        user.bankAccount = bankAccount || user.bankAccount;

        // Logika Upload File (Avatar & QRIS)
        if (req.files) {
            // 1. Jika ada upload foto profil (avatar)
            if (req.files.avatar) {
                const avatarUrl = await uploadToCloudinary(req.files.avatar[0].buffer, 'avatars');
                user.profilePicture = avatarUrl;
            }
            // 2. Jika ada upload QRIS
            if (req.files.qris) {
                const qrisUrl = await uploadToCloudinary(req.files.qris[0].buffer, 'qris_codes');
                user.qrisUrl = qrisUrl;
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profil dan data rekening berhasil diperbarui!',
            data: user
        });
    } catch (error) {
        console.error("Error Update Profile:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};