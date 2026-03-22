const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Nama wajib diisi'] 
    },
    email: { 
        type: String, 
        required: [true, 'Email atau ID Admin wajib diisi'], 
        unique: true,
        validate: {
            validator: function(v) {
                // Jika yang mendaftar adalah Admin, langsung lolos (bisa pakai angka/ID bebas)
                if (this.role === 'admin') {
                    return true;
                }
                // Jika Mahasiswa (buyer/seller), wajib berakhiran .ac.id
                return /.+\.ac\.id$/.test(v);
            },
            message: 'Hanya email kampus (.ac.id) yang diizinkan untuk mahasiswa!'
        }
    },
    password: { 
        type: String, 
        required: [true, 'Password wajib diisi'] 
    },
    profilePicture: { 
        type: String, 
        default: 'https://res.cloudinary.com/dy4f964p4/image/upload/v1710565258/avatars/default-avatar_u9l2dx.png' 
    },
    domisili: { 
        type: String, 
        // Logika Pintar: Domisili hanya wajib jika role BUKAN admin
        required: [
            function() { return this.role !== 'admin'; }, 
            'Domisili wajib diisi untuk keperluan COD'
        ] 
    },
    campus: { 
        type: String, 
        // Logika Pintar: Kampus hanya wajib jika role BUKAN admin
        required: [
            function() { return this.role !== 'admin'; }, 
            'Asal kampus wajib diisi'
        ] 
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    role: { 
        type: String, 
        enum: ['buyer', 'seller', 'admin'], 
        default: 'buyer' 
    },
    bankName: { type: String, default: '' },
    bankAccountName: { type: String, default: null },
    lastActive: { type: Date, default: Date.now },
    bankAccount: { type: String, default: '' }, 
    qrisUrl: { 
        type: String, default: '' 
    }, 
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: null },
    banUntil: { type: Date, default: null },
    verificationToken: { 
        type: String 
    },
    rating: { 
        type: Number, 
        default: 0 
    },
    strikeCount: { 
        type: Number, 
        default: 0 
    },
    
    // ==========================================
    // TAMBAHAN UNTUK FITUR LUPA PASSWORD
    // ==========================================
    resetPasswordOtp: { 
        type: String 
    },
    resetPasswordOtpExpires: { 
        type: Date 
    },

    // ==========================================
    // 🌟 FITUR WISHLIST BARU
    // ==========================================
    wishlist: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
    }]

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);