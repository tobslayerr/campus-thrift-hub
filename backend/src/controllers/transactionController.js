const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Notification = require('../models/Notification'); // 🔔 IMPORT NOTIFIKASI
const { uploadToCloudinary } = require('../middlewares/upload');

exports.checkout = async (req, res) => {
    try {
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
            paymentMethod: paymentMethod || 'Transfer Bank (Default)' 
        });

        product.stock -= 1;
        if (product.stock === 0) {
            product.status = 'Menunggu Pembayaran';
        } else {
            product.status = 'Tersedia'; 
        }
        await product.save();

        // ==========================================
        // 🔔 NOTIFIKASI CHECKOUT
        // ==========================================
        await Notification.create({
            userId: buyerId,
            title: 'Pesanan Dibuat! 🛒',
            message: `Checkout untuk "${product.title}" berhasil. Silakan tunggu Admin memverifikasi pembayaran Anda.`,
            type: 'TRANSACTION'
        });

        await Notification.create({
            userId: product.sellerId,
            title: 'Pesanan Baru Masuk! 📦',
            message: `Barang Anda "${product.title}" telah dipesan. Menunggu Admin memverifikasi pembayaran pembeli.`,
            type: 'TRANSACTION'
        });

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

        const oldStatus = transaction.status;
        transaction.status = status;
        await transaction.save();

        const productTitle = transaction.productId ? transaction.productId.title : 'Barang (Dihapus)';

        if (status === 'Selesai') {
            if (transaction.productId) await Product.findByIdAndUpdate(transaction.productId._id, { status: 'Selesai' });
        } else if (status === 'Dana Ditahan (Siap COD)') {
            if (transaction.productId) await Product.findByIdAndUpdate(transaction.productId._id, { status: 'Dana Ditahan (Siap COD)' });
            
            // ==========================================
            // 🔔 NOTIFIKASI UANG MASUK KE ADMIN (SIAP COD)
            // ==========================================
            if (oldStatus !== 'Dana Ditahan (Siap COD)') {
                await Notification.create({ 
                    userId: transaction.buyerId, 
                    title: 'Pembayaran Diterima 💸', 
                    message: `Pembayaran Anda untuk "${productTitle}" telah diverifikasi Admin. Silakan janjian COD dengan penjual!`, 
                    type: 'TRANSACTION' 
                });
                await Notification.create({ 
                    userId: transaction.sellerId, 
                    title: 'Uang Telah Diamankan 🤝', 
                    message: `Uang pembelian "${productTitle}" sudah ditahan sistem. Silakan ketemuan dan minta PIN pembeli untuk pencairan.`, 
                    type: 'TRANSACTION' 
                });
            }
        } else if (status === 'Sengketa') {
            // ==========================================
            // 🔔 NOTIFIKASI SENGKETA
            // ==========================================
            await Notification.create({ 
                userId: transaction.buyerId, 
                title: 'Transaksi Bersengketa ⚠️', 
                message: `Transaksi untuk "${productTitle}" sedang ditangguhkan karena ada masalah/laporan. Admin sedang meninjau kasus ini.`, 
                type: 'TRANSACTION' 
            });
            await Notification.create({ 
                userId: transaction.sellerId, 
                title: 'Transaksi Bersengketa ⚠️', 
                message: `Pencairan dana untuk "${productTitle}" ditangguhkan karena ada laporan sengketa. Admin akan menghubungi Anda.`, 
                type: 'TRANSACTION' 
            });
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

        const product = await Product.findByIdAndUpdate(transaction.productId, { status: 'Selesai' });
        const productTitle = product ? product.title : 'Barang';

        // ==========================================
        // 🔔 NOTIFIKASI COD BERHASIL
        // ==========================================
        await Notification.create({ 
            userId: transaction.buyerId, 
            title: 'Transaksi Selesai 🎯', 
            message: `Barang "${productTitle}" telah Anda terima. Jangan lupa berikan ulasan ke penjual untuk membantu reputasinya!`, 
            type: 'TRANSACTION' 
        });
        await Notification.create({ 
            userId: transaction.sellerId, 
            title: 'COD Berhasil 🎉', 
            message: `PIN Benar! Dana penjualan "${productTitle}" akan segera diproses dan dicairkan oleh Admin ke rekening Anda.`, 
            type: 'TRANSACTION' 
        });

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

        const product = await Product.findById(transaction.productId);
        const productTitle = product ? product.title : 'Barang';

        // ==========================================
        // 🔔 NOTIFIKASI PENCAIRAN DANA
        // ==========================================
        await Notification.create({ 
            userId: transaction.sellerId, 
            title: 'Dana Telah Dicairkan 💰', 
            message: `Hore! Dana penjualan "${productTitle}" sebesar Rp${(transaction.sellerIncome || transaction.price).toLocaleString('id-ID')} telah ditransfer Admin ke rekening Anda. Silakan cek mutasi Anda.`, 
            type: 'TRANSACTION' 
        });

        res.status(200).json({ success: true, message: 'Status berhasil diubah menjadi Dana Dicairkan!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};