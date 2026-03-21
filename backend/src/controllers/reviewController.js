const Review = require('../models/Review');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { uploadToCloudinary } = require('../middlewares/upload');

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

        // 5. Kalkulasi Ulang Rating Penjual
        const allReviews = await Review.find({ sellerId });
        const totalRating = allReviews.reduce((acc, item) => acc + item.rating, 0);
        const avgRating = totalRating / allReviews.length;
        
        await User.findByIdAndUpdate(sellerId, { rating: avgRating });

        // Return data yang dipopulate agar Frontend bisa langsung menampilkan UI ulasannya
        const populatedReview = await Review.findById(review._id).populate('buyerId', 'name profilePicture');

        res.status(201).json({ success: true, data: populatedReview, message: 'Ulasan berhasil dikirim!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

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