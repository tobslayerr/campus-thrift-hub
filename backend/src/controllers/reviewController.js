const Review = require('../models/Review');
const User = require('../models/User');

// @desc    Buat Ulasan Baru
// @route   POST /api/reviews
exports.createReview = async (req, res) => {
    try {
        const { productId, sellerId, rating, comment } = req.body;
        const buyerId = req.user.id;

        // Cek apakah ulasan untuk produk ini sudah ada
        const existingReview = await Review.findOne({ productId });
        if (existingReview) {
            return res.status(400).json({ message: 'Anda sudah memberikan ulasan untuk produk ini.' });
        }

        // Simpan Ulasan
        const review = await Review.create({ productId, sellerId, buyerId, rating, comment });

        // Kalkulasi ulang rata-rata rating penjual
        const allReviews = await Review.find({ sellerId });
        const avgRating = allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length;
        
        // Update rating di profil penjual
        await User.findByIdAndUpdate(sellerId, { rating: avgRating });

        res.status(201).json({ success: true, data: review, message: 'Ulasan berhasil dikirim!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Ambil Ulasan Berdasarkan Produk
// @route   GET /api/reviews/product/:productId
exports.getProductReview = async (req, res) => {
    try {
        const review = await Review.findOne({ productId: req.params.productId }).populate('buyerId', 'name profilePicture');
        res.status(200).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};