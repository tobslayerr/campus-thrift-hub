const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { uploadToCloudinary } = require('../middlewares/upload');

// @desc    Pembeli Melakukan Checkout & Upload Struk
// @route   POST /api/transactions/checkout
exports.checkout = async (req, res) => {
    try {
        const { productId } = req.body;
        const buyerId = req.user.id;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan' });

        // 🛡️ PAGAR BACKEND: Tolak jika pembeli adalah penjual barang itu sendiri
        if (product.sellerId.toString() === buyerId) {
            return res.status(400).json({ message: 'Ditolak: Anda tidak bisa membeli barang jualan Anda sendiri!' });
        }

        if (!req.file) return res.status(400).json({ message: 'Bukti transfer wajib diupload!' });

        // Upload struk ke Cloudinary
        const proofUrl = await uploadToCloudinary(req.file.buffer, 'proofs');

        // Kalkulasi Keuangan (Komisi 5%)
        const adminFee = product.price * 0.05;
        const sellerIncome = product.price - adminFee;

        // Generate 4-Digit PIN COD
        const codPin = Math.floor(1000 + Math.random() * 9000).toString();

        // SIMPAN DENGAN FORMAT BARU (*Id)
        const transaction = await Transaction.create({
            productId: productId,
            buyerId: buyerId,
            sellerId: product.sellerId,
            price: product.price,
            adminFee,
            sellerIncome,
            codPin,
            proofOfPayment: proofUrl
        });

        // Ubah status produk agar tidak bisa dibeli orang lain
        product.status = 'Menunggu Pembayaran';
        await product.save();

        res.status(201).json({ success: true, transaction, message: 'Checkout berhasil, menunggu admin.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Admin Memverifikasi Uang Masuk / Selesai
// @route   PUT /api/transactions/:id/status
exports.updateStatus = async (req, res) => {
    try {
        // Cek apakah yang akses ini Admin
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak. Hanya Admin!' });

        const { status } = req.body; // 'Dana Ditahan (Siap COD)' atau 'Selesai'
        const transaction = await Transaction.findById(req.params.id).populate('productId');

        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        transaction.status = status;
        await transaction.save();

        // Jika selesai, ubah juga status produknya
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

// @desc    Admin Mengambil Semua Data Transaksi
// @route   GET /api/transactions
exports.getAllTransactions = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });
        
        const transactions = await Transaction.find()
            .populate('productId', 'title price')
            .populate('buyerId', 'name email')
            .populate('sellerId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Ambil Riwayat Pembelian & Penjualan User (DASHBOARD)
// @route   GET /api/transactions/my-transactions
exports.getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`🔍 [DEBUG] Mencari transaksi untuk User ID: ${userId}`);

        // KINI KODE SANGAT BERSIH, TANPA LOGIKA $OR YANG RUMIT
        const purchases = await Transaction.find({ buyerId: userId })
            .populate('productId', 'title imageUrl price') 
            .populate('sellerId', 'name campus profilePicture')
            .sort({ createdAt: -1 });

        const sales = await Transaction.find({ sellerId: userId })
            .populate('productId', 'title imageUrl price')
            .populate('buyerId', 'name domisili profilePicture')
            .sort({ createdAt: -1 });

        console.log(`✅ [DEBUG] Ditemukan: ${purchases.length} Pembelian, ${sales.length} Penjualan`);

        res.status(200).json({ 
            success: true, 
            data: { purchases, sales } 
        });
    } catch (error) {
        console.error("❌ [DEBUG] Error Get Transactions:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Penjual memverifikasi PIN COD dari Pembeli
// @route   POST /api/transactions/:id/verify-pin
exports.verifyCodPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        // 1. Pastikan yang verifikasi adalah penjualnya langsung
        if (transaction.sellerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Ditolak: Hanya penjual yang bisa memverifikasi PIN ini' });
        }

        // 2. Pastikan statusnya memang sedang ditahan (Siap COD)
        if (transaction.status !== 'Dana Ditahan (Siap COD)') {
            return res.status(400).json({ message: 'Status transaksi belum siap untuk COD' });
        }

        // 3. Cek Kecocokan PIN
        if (transaction.codPin !== pin) {
            return res.status(400).json({ message: 'PIN SALAH! Pastikan Anda meminta PIN yang benar dari pembeli.' });
        }

        // 4. Jika Valid, Ubah Status jadi Selesai
        transaction.status = 'Selesai';
        await transaction.save();

        // 5. Ubah juga status produk menjadi selesai
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