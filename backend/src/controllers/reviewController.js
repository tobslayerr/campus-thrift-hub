const Review = require('../models/Review');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product'); // 📦 IMPORT PRODUCT (Untuk ambil judul barang)
const Notification = require('../models/Notification'); // 🔔 IMPORT NOTIFIKASI
const { uploadToCloudinary } = require('../middlewares/upload');
const sendEmail = require('../utils/sendEmail'); // 📧 IMPORT SEND EMAIL

exports.createReview = async (req, res) => {
    try {
        const { productId, sellerId, transactionId, rating, comment } = req.body;
        const buyerId = req.user.id;

        // 1. Validasi Transaksi
        const transaction = await Transaction.findOne({ 
            _id: transactionId, 
            buyerId, 
            status: { $in: ['Selesai', 'Dana Dicairkan'] } 
        });
        
        if (!transaction) return res.status(400).json({ message: 'Transaksi tidak valid atau belum selesai.' });

        // 2. Cek apakah transaksi ini SUDAH PERNAH diulas
        const existingReview = await Review.findOne({ transactionId });
        if (existingReview) return res.status(400).json({ message: 'Anda sudah mengulas transaksi ini.' });

        // 3. Upload gambar
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(
                req.files.map(file => uploadToCloudinary(file.buffer, 'reviews'))
            );
        }

        // 4. Buat Ulasan
        const review = await Review.create({
            productId, sellerId, buyerId, transactionId,
            rating: Number(rating), 
            comment, 
            images: imageUrls
        });

        // 5. Kalkulasi Ulang Rating Penjual (Optimasi: Menggunakan Average dari Database)
        const stats = await Review.aggregate([
            { $match: { sellerId: transaction.sellerId } },
            { $group: { _id: '$sellerId', avgRating: { $avg: '$rating' } } }
        ]);

        if (stats.length > 0) {
            await User.findByIdAndUpdate(transaction.sellerId, { 
                rating: stats[0].avgRating.toFixed(1) 
            });
        }

        // ====================================================================
        // 🌟 6. LOGIKA NOTIFIKASI IN-APP & EMAIL KE PENJUAL 🌟
        // ====================================================================
        const seller = await User.findById(sellerId);
        const buyer = await User.findById(buyerId);
        const product = await Product.findById(productId);
        const productTitle = product ? product.title : 'Barang';

        if (seller) {
            // A. Kirim Notifikasi Tab / In-App
            await Notification.create({
                userId: sellerId,
                title: 'Ulasan Baru Diterima! ⭐',
                message: `${buyer.name} memberikan ${rating} Bintang untuk pesanan "${productTitle}".`,
                type: 'SYSTEM'
            });

            // B. Kirim Email Pemberitahuan
            if (seller.email) {
                const starsHtml = '⭐'.repeat(Number(rating)); // Generate bintang sesuai rating
                const emailHtml = `
                    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; max-w: 600px; margin: 0 auto;">
                        <h2 style="color: #FF9500; margin-top: 0;">Anda Mendapat Ulasan Baru! 🎉</h2>
                        <p style="color: #334155; font-size: 16px;">Halo <strong>${seller.name}</strong>,</p>
                        <p style="color: #334155; font-size: 16px;">Selamat! Pembeli <strong>${buyer.name}</strong> baru saja memberikan ulasan untuk produk jualan Anda: <strong>"${productTitle}"</strong>.</p>
                        
                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0; color: #475569;">
                            <p style="margin: 0 0 10px 0; font-size: 18px;"><strong>Penilaian:</strong> <span style="color: #FF9500;">${starsHtml}</span> (${rating}/5)</p>
                            <p style="margin: 0; font-style: italic;">"${comment || 'Tidak ada komentar tertulis.'}"</p>
                        </div>
                        
                        <p style="color: #334155; font-size: 14px;">Pertahankan terus performa dan kualitas pelayanan toko Anda agar makin banyak pembeli yang tertarik!</p>
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Sistem Notifikasi Otomatis - Campus Thrift Hub.</p>
                    </div>
                `;

                // Kirim email secara asinkron agar tidak membuat loading lambat bagi pembeli saat memberi ulasan
                sendEmail({
                    email: seller.email,
                    subject: `Ulasan Baru: ${rating} Bintang dari ${buyer.name} ⭐`,
                    message: emailHtml
                }).catch(err => console.error("Gagal kirim email ulasan baru:", err));
            }
        }

        // Return data yang dipopulate agar Frontend bisa langsung menampilkan UI ulasannya
        const populatedReview = await Review.findById(review._id).populate('buyerId', 'name profilePicture');

        res.status(201).json({ success: true, data: populatedReview, message: 'Ulasan berhasil dikirim!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Ambil ulasan berdasarkan Produk
exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId })
            .populate('buyerId', 'name profilePicture campus')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Ambil semua ulasan milik seorang Penjual (untuk halaman Profil Penjual)
exports.getSellerReviews = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const reviews = await Review.find({ sellerId })
            .populate('buyerId', 'name profilePicture campus')
            .populate('productId', 'name images') // Mengetahui produk mana yang diulas
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            count: reviews.length,
            data: reviews 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Cek status apakah user bisa mengulas transaksi ini (untuk tombol di Frontend)
exports.checkReviewStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const review = await Review.findOne({ transactionId });
        
        res.status(200).json({ 
            success: true, 
            alreadyReviewed: !!review 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};