const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const { uploadToCloudinary } = require('../middlewares/upload');

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

// @desc    Verifikasi OTP saat Registrasi
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

        if (user.isBanned) {
            const now = new Date();
            if (!user.banUntil || new Date(user.banUntil) > now) {
                return res.status(403).json({ 
                    success: false, 
                    isBanned: true, 
                    banReason: user.banReason, 
                    banUntil: user.banUntil,
                    message: 'Akun Anda telah diblokir oleh Admin.' 
                });
            } else {
                user.isBanned = false;
                user.banReason = null;
                user.banUntil = null;
                await user.save();
            }
        }

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
                bankAccountName: user.bankAccountName, // 🌟 Pastikan ini ada
                qrisUrl: user.qrisUrl
            },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Admin Login
// @route   POST /api/auth/admin/login
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Kredensial tidak valid' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ success: true, token, admin: { id: user._id, name: user.name, role: user.role } });
    } catch (error) { 
        res.status(500).json({ success: false, error: error.message }); 
    }
};

// ==========================================
// FITUR LUPA PASSWORD
// ==========================================

// @desc    Minta OTP Lupa Password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'Email tidak ditemukan di sistem.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpires = Date.now() + 15 * 60 * 1000; 
        await user.save();

        const message = `Halo ${user.name},\n\nAnda meminta untuk mereset kata sandi. Berikut adalah kode OTP Anda:\n\n${otp}\n\nKode ini akan kadaluarsa dalam 15 menit. Jika Anda tidak merasa memintanya, abaikan email ini.`;

        await sendEmail({
            email: user.email,
            subject: 'Kode OTP Reset Password - Campus Thrift Hub',
            message: message
        });

        res.status(200).json({ success: true, message: 'Kode OTP telah dikirim ke email Anda.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memproses permintaan.', error: error.message });
    }
};

// @desc    Verifikasi OTP untuk Reset Password
// @route   POST /api/auth/verify-reset-otp
exports.verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        if (user.resetPasswordOtp !== otp) return res.status(400).json({ message: 'Kode OTP salah.' });
        if (user.resetPasswordOtpExpires < Date.now()) return res.status(400).json({ message: 'Kode OTP sudah kadaluarsa. Silakan minta ulang.' });

        res.status(200).json({ success: true, message: 'OTP Valid.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Ganti Password Baru
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        if (user.resetPasswordOtp !== otp || user.resetPasswordOtpExpires < Date.now()) {
            return res.status(400).json({ message: 'Sesi reset password tidak valid atau kadaluarsa.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Password berhasil diubah. Silakan login.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// FUNGSI PROFIL PENGGUNA
// ==========================================

// @desc    Get Current User Data
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        // 🌟 PERBAIKAN FATAL: 
        // Konstruksikan ulang object JSON agar memiliki properti 'id' (bukan hanya '_id') 
        // dan sertakan 'bankAccountName' agar state tidak hilang.
        const normalizedUser = {
            id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role,
            campus: user.campus,
            domisili: user.domisili,
            profilePicture: user.profilePicture,
            bankName: user.bankName,
            bankAccount: user.bankAccount,
            bankAccountName: user.bankAccountName, // 🌟 Pastikan ini ada
            qrisUrl: user.qrisUrl
        };

        res.status(200).json({ success: true, data: normalizedUser });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update Profile & Rekening
// @route   PUT /api/auth/update-profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, campus, domisili, bankName, bankAccount, bankAccountName } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        user.name = name || user.name;
        user.campus = campus || user.campus;
        user.domisili = domisili || user.domisili;
        user.bankName = bankName || user.bankName;
        user.bankAccount = bankAccount || user.bankAccount;
        user.bankAccountName = bankAccountName || user.bankAccountName; // 🌟 Tangkap data atas nama

        if (req.files) {
            if (req.files.avatar) {
                const avatarUrl = await uploadToCloudinary(req.files.avatar[0].buffer, 'avatars');
                user.profilePicture = avatarUrl;
            }
            if (req.files.qris) {
                const qrisUrl = await uploadToCloudinary(req.files.qris[0].buffer, 'qris_codes');
                user.qrisUrl = qrisUrl;
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profil dan data rekening berhasil diperbarui!',
            data: user // Ingat, ini dikembalikan tapi kita akan mengabaikannya atau merefresh state di frontend.
        });
    } catch (error) {
        console.error("Error Update Profile:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};