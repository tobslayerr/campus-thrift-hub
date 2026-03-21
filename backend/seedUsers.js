require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');

const seedDummyUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // Hapus data lama agar bersih
        await User.deleteMany({ email: { $in: ['nabil.seller@unj.ac.id', 'budi.buyer@unj.ac.id', 'siti.test@unj.ac.id'] } });
        console.log('⏳ Menyuntik ulang akun dummy dengan data domisili & kampus...');

        const dummyUsers = [
            {
                name: 'Nabil Penjual',
                email: 'nabil.seller@unj.ac.id',
                password: 'password123',
                role: 'seller',
                domisili: 'Rawamangun, Pulo Gadung',
                campus: 'Universitas Negeri Jakarta (UNJ)',
                profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg' // Contoh foto dummy
            },
            {
                name: 'Budi Pembeli',
                email: 'budi.buyer@unj.ac.id',
                password: 'password123',
                role: 'buyer',
                domisili: 'Kramat Jati, Jakarta Timur',
                campus: 'Politeknik Negeri Jakarta (PNJ)',
                profilePicture: 'https://randomuser.me/api/portraits/men/44.jpg'
            },
            {
                name: 'Siti Mahasiswa',
                email: 'siti.test@unj.ac.id',
                password: 'password123',
                role: 'buyer',
                domisili: 'Depok Margonda',
                campus: 'Universitas Indonesia (UI)',
                profilePicture: 'https://randomuser.me/api/portraits/women/65.jpg'
            }
        ];

        for (let data of dummyUsers) {
            // Cek apakah email sudah ada agar tidak duplikat
            const exists = await User.findOne({ email: data.email });
            if (!exists) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(data.password, salt);

                await User.create({
                    ...data,
                    password: hashedPassword,
                    isVerified: true // LANGSUNG AKTIF TANPA OTP
                });
                console.log(`✅ Berhasil membuat akun: ${data.email}`);
            } else {
                console.log(`⚠️ Akun ${data.email} sudah ada, melewati...`);
            }
        }

        console.log('\n🔥 Semua akun dummy siap digunakan untuk testing!');
        process.exit();
    } catch (error) {
        console.error('❌ Error Seeding:', error.message);
        process.exit(1);
    }
};

seedDummyUsers();