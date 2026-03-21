require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');

const createAdmin = async () => {
    try {
        // 1. Konek ke Database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('⏳ Menghubungkan ke MongoDB...');

        const adminEmail = 'admin@campusthrift.com'; // Email admin Anda
        const adminPassword = 'AdminKeren123!'; // Password admin Anda

        // 2. Cek apakah admin sudah pernah dibuat sebelumnya
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('⚠️ Akun Admin sudah ada di database! Silakan langsung login.');
            process.exit();
        }

        // 3. Hash Password (Wajib agar bisa login)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // 4. Suntikkan ke Database
        await User.create({
            name: 'Pusat Kendali Thrift Hub',
            email: adminEmail,
            password: hashedPassword,
            isVerified: true,  // Langsung aktif tanpa perlu OTP
            role: 'admin'      // KUNCI UTAMA: Role di-set sebagai Admin
        });

        console.log('✅ BINGO! Akun Admin BERHASIL dibuat!');
        console.log('====================================');
        console.log(`📧 Email    : ${adminEmail}`);
        console.log(`🔑 Password : ${adminPassword}`);
        console.log('====================================');

        process.exit(); // Matikan skrip otomatis setelah selesai
    } catch (error) {
        console.error('❌ Gagal membuat admin:', error.message);
        process.exit(1);
    }
};

createAdmin();