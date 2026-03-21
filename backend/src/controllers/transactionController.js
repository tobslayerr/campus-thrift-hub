const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { uploadToCloudinary } = require('../middlewares/upload');

exports.checkout = async (req, res) => {
    try {
        // FITUR BARU: Tangkap paymentMethod dari frontend
        const { productId, paymentMethod } = req.body;
        const buyerId = req.user.id;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan' });

        if (product.sellerId.toString() === buyerId) {
            return res.status(400).json({ message: 'Ditolak: Anda tidak bisa membeli barang jualan Anda sendiri!' });
        }

        if (product.stock < 1 || product.status === 'Terjual' || product.status === 'Dihapus') {
            return res.status(400).json({ message: 'Maaf, stok barang sudah habis atau sudah terjual!' });
        }

        if (!req.file) return res.status(400).json({ message: 'Bukti transfer wajib diupload!' });

        const proofUrl = await uploadToCloudinary(req.file.buffer, 'proofs');
        const adminFee = product.price * 0.05;
        const sellerIncome = product.price - adminFee;
        const codPin = Math.floor(1000 + Math.random() * 9000).toString();

        const transaction = await Transaction.create({
            productId: productId,
            buyerId: buyerId,
            sellerId: product.sellerId,
            price: product.price,
            adminFee,
            sellerIncome,
            codPin,
            proofOfPayment: proofUrl,
            // FITUR BARU: Simpan pilihan rekening admin ke database
            paymentMethod: paymentMethod || 'Transfer Bank (Default)' 
        });

        product.stock -= 1;
        if (product.stock === 0) {
            product.status = 'Menunggu Pembayaran';
        } else {
            product.status = 'Tersedia'; 
        }
        await product.save();

        res.status(201).json({ success: true, transaction, message: 'Checkout berhasil, menunggu admin.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak. Hanya Admin!' });

        const { status } = req.body; 
        const transaction = await Transaction.findById(req.params.id).populate('productId');

        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        transaction.status = status;
        await transaction.save();

        if (status === 'Selesai') {
            await Product.findByIdAndUpdate(transaction.productId._id, { status: 'Selesai' });
        } else if (status === 'Dana Ditahan (Siap COD)') {
            await Product.findByIdAndUpdate(transaction.productId._id, { status: 'Dana Ditahan (Siap COD)' });
        }

        res.status(200).json({ success: true, message: `Status diperbarui menjadi: ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAllTransactions = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });
        
        const transactions = await Transaction.find()
            .populate('productId', 'title price images imageUrl')
            .populate('buyerId', 'name email')
            .populate('sellerId', 'name bankName bankAccount qrisUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ========================================================
// FUNGSI INI YANG DIPERBAIKI UNTUK MENCEGAH ULASAN GANDA
// ========================================================
exports.getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.id;

        let purchases = await Transaction.find({ buyerId: userId })
            .populate('productId', 'title imageUrl images price') 
            .populate('sellerId', 'name campus profilePicture')
            .sort({ createdAt: -1 })
            .lean(); // Wajib pakai lean agar bisa kita modifikasi datanya

        let sales = await Transaction.find({ sellerId: userId })
            .populate('productId', 'title imageUrl images price')
            .populate('buyerId', 'name domisili profilePicture')
            .sort({ createdAt: -1 })
            .lean();

        // Proses menggabungkan data Ulasan ke dalam array Pembelian
        for (let i = 0; i < purchases.length; i++) {
            // 1. Coba cari ulasan dengan sistem baru (berdasarkan ID Transaksi)
            let review = await Review.findOne({ transactionId: purchases[i]._id }).populate('buyerId', 'name profilePicture');
            
            // 2. BACKWARD COMPATIBILITY: 
            // Jika tidak ketemu (karena ini ulasan lama), cari berdasarkan ID Produk dan Pembeli
            if (!review && purchases[i].productId) {
                review = await Review.findOne({ 
                    productId: purchases[i].productId._id, 
                    buyerId: userId 
                }).populate('buyerId', 'name profilePicture');
            }

            // Tempelkan ulasan ke objek transaksi
            purchases[i].review = review || null; 
        }

        res.status(200).json({ 
            success: true, 
            data: { purchases, sales } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.verifyCodPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        if (transaction.sellerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Ditolak: Hanya penjual yang bisa memverifikasi PIN ini' });
        }

        if (transaction.status !== 'Dana Ditahan (Siap COD)') {
            return res.status(400).json({ message: 'Status transaksi belum siap untuk COD' });
        }

        if (transaction.codPin !== pin) {
            return res.status(400).json({ message: 'PIN SALAH! Pastikan Anda meminta PIN yang benar dari pembeli.' });
        }

        transaction.status = 'Selesai';
        await transaction.save();

        await Product.findByIdAndUpdate(transaction.productId, { status: 'Selesai' });

        res.status(200).json({ 
            success: true, 
            message: '✅ PIN Valid! Transaksi Selesai. Admin akan segera meneruskan dana ke rekening Anda.' 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.disburseFunds = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });

        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        if (transaction.status !== 'Selesai') {
            return res.status(400).json({ message: 'Transaksi belum selesai (COD belum beres)!' });
        }

        transaction.status = 'Dana Dicairkan';
        await transaction.save();

        res.status(200).json({ success: true, message: 'Status berhasil diubah menjadi Dana Dicairkan!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};