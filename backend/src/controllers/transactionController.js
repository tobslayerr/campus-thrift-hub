const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const { uploadToCloudinary } = require('../middlewares/upload');

exports.checkout = async (req, res) => {
    try {
        const { 
            productId, 
            paymentMethod, 
            deliveryMethod, 
            buyerAddress, 
            buyerPhone, 
            buyerLocationPoint, 
            codMeetingPoint // <--- PENAMBAHAN FIELD TITIK TEMU COD
        } = req.body;
        const buyerId = req.user.id;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan' });

        if (product.sellerId.toString() === buyerId) {
            return res.status(400).json({ message: 'Ditolak: Anda tidak bisa membeli barang jualan Anda sendiri!' });
        }

        if (product.stock < 1 || product.status === 'Terjual' || product.status === 'Dihapus') {
            return res.status(400).json({ message: 'Maaf, stok barang sudah habis atau sudah terjual!' });
        }

        // VALIDASI ALAMAT PENGIRIMAN VS COD
        if (deliveryMethod === 'Pengiriman') {
            if (!buyerAddress || !buyerPhone || !buyerLocationPoint) {
                return res.status(400).json({ message: 'Alamat lengkap, No HP, dan Titik Patokan wajib diisi untuk pengiriman!' });
            }
        } else if (deliveryMethod === 'COD') {
            if (!codMeetingPoint) {
                return res.status(400).json({ message: 'Titik Temu COD wajib diisi agar penjual tahu lokasi pertemuan!' });
            }
        }

        if (!req.file) return res.status(400).json({ message: 'Bukti transfer wajib diupload!' });

        const proofUrl = await uploadToCloudinary(req.file.buffer, 'proofs');
        
        let adminFee = product.price <= 100000 ? product.price * 0.05 : product.price * 0.10;
        const sellerIncome = product.price - adminFee; 
        const codPin = Math.floor(1000 + Math.random() * 9000).toString();

        const generateTxId = () => {
            const datePart = Date.now().toString().slice(-5);
            const randomPart = Math.floor(100 + Math.random() * 900);
            return `CTH-${datePart}${randomPart}`;
        };

        const transaction = await Transaction.create({
            transactionId: generateTxId(),
            productId: productId,
            buyerId: buyerId,
            sellerId: product.sellerId,
            price: product.price,
            adminFee: adminFee,
            sellerIncome: sellerIncome,
            codPin,
            proofOfPayment: proofUrl,
            paymentMethod: paymentMethod || 'Transfer Bank',
            deliveryMethod: deliveryMethod || 'COD',
            buyerAddress,         
            buyerPhone,           
            buyerLocationPoint,
            codMeetingPoint // <--- SIMPAN TITIK TEMU KE DATABASE
        });

        product.stock -= 1;
        product.status = product.stock === 0 ? 'Menunggu Pembayaran' : 'Tersedia';
        await product.save();

        if (deliveryMethod === 'Pengiriman') {
            await Notification.create({ userId: buyerId, title: 'Pesanan Dibuat! 🛒', message: `Checkout "${product.title}" via Ekspedisi berhasil. Menunggu verifikasi pembayaran oleh Admin.`, type: 'TRANSACTION' });
            await Notification.create({ userId: product.sellerId, title: 'Pesanan Baru Masuk! 📦', message: `Barang Anda "${product.title}" telah dipesan via Ekspedisi. Menunggu admin memverifikasi pembayaran.`, type: 'TRANSACTION' });
        } else {
            await Notification.create({ userId: buyerId, title: 'Pesanan Dibuat! 🛒', message: `Checkout "${product.title}" via COD di ${codMeetingPoint} berhasil. Menunggu verifikasi pembayaran oleh Admin.`, type: 'TRANSACTION' });
            await Notification.create({ userId: product.sellerId, title: 'Pesanan Baru Masuk! 🤝', message: `Barang Anda "${product.title}" telah dipesan via COD. Titik temu di: ${codMeetingPoint}. Menunggu admin memverifikasi pembayaran.`, type: 'TRANSACTION' });
        }

        res.status(201).json({ success: true, transaction, message: 'Checkout berhasil, menunggu admin.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
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
            
            if (oldStatus !== 'Dana Ditahan (Siap COD)') {
                if (transaction.deliveryMethod === 'Pengiriman') {
                    await Notification.create({ userId: transaction.buyerId, title: 'Pembayaran Diverifikasi 💸', message: `Pembayaran untuk "${productTitle}" telah diverifikasi Admin. Penjual akan segera memproses pengiriman barang Anda.`, type: 'TRANSACTION' });
                    await Notification.create({ userId: transaction.sellerId, title: 'Pesanan Siap Dikirim! 🚚', message: `Uang pembelian "${productTitle}" sudah diamankan sistem. Silakan segera kemas barang, kirim, dan input resi di Dashboard!`, type: 'TRANSACTION' });
                } else {
                    const meetingInfo = transaction.codMeetingPoint ? ` di ${transaction.codMeetingPoint}` : '';
                    await Notification.create({ userId: transaction.buyerId, title: 'Pembayaran Diverifikasi 💸', message: `Pembayaran Anda untuk "${productTitle}" telah diverifikasi Admin. Silakan janjian COD dengan penjual${meetingInfo}!`, type: 'TRANSACTION' });
                    await Notification.create({ userId: transaction.sellerId, title: 'Uang Telah Diamankan 🤝', message: `Uang pembelian "${productTitle}" sudah ditahan sistem. Silakan ketemuan${meetingInfo} dan minta 4-Digit PIN pembeli untuk pencairan.`, type: 'TRANSACTION' });
                }
            }
        } else if (status === 'Sengketa') {
            await Notification.create({ userId: transaction.buyerId, title: 'Transaksi Bersengketa ⚠️', message: `Transaksi untuk "${productTitle}" sedang ditangguhkan karena ada masalah/laporan. Admin sedang meninjau kasus ini.`, type: 'TRANSACTION' });
            await Notification.create({ userId: transaction.sellerId, title: 'Transaksi Bersengketa ⚠️', message: `Pencairan dana untuk "${productTitle}" ditangguhkan karena ada laporan sengketa. Admin akan meninjau kasus ini.`, type: 'TRANSACTION' });
        }

        res.status(200).json({ success: true, message: `Status diperbarui menjadi: ${status}` });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.shipItem = async (req, res) => {
    try {
        const { shippingCourier, shippingResi } = req.body;
        const transaction = await Transaction.findById(req.params.id).populate('productId');
        
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        if (transaction.sellerId.toString() !== req.user.id) return res.status(403).json({ message: 'Ditolak: Hanya penjual!' });
        if (transaction.status !== 'Dana Ditahan (Siap COD)') return res.status(400).json({ message: 'Transaksi belum siap dikirim' });

        transaction.shippingCourier = shippingCourier;
        transaction.shippingResi = shippingResi;
        transaction.shippingProgress = 'Barang dalam perjalanan';
        transaction.status = 'Barang Dikirim';
        await transaction.save();

        await Notification.create({ userId: transaction.buyerId, title: 'Barang Telah Dikirim 🚚', message: `Pesanan "${transaction.productId.title}" telah dikirim via ${shippingCourier}. Resi: ${shippingResi}. Harap konfirmasi jika barang sudah sampai.`, type: 'TRANSACTION' });

        res.status(200).json({ success: true, message: 'Status berhasil diubah menjadi Barang Dikirim.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.confirmDelivery = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id).populate('productId');
        
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        if (transaction.buyerId.toString() !== req.user.id) return res.status(403).json({ message: 'Ditolak: Hanya pembeli!' });
        if (transaction.status !== 'Barang Dikirim') return res.status(400).json({ message: 'Barang belum dikirim oleh penjual.' });

        transaction.status = 'Selesai';
        transaction.shippingProgress = 'Barang Diterima Pembeli';
        await transaction.save();

        await Product.findByIdAndUpdate(transaction.productId, { status: 'Terjual', stock: 0 });

        await Notification.create({ userId: transaction.sellerId, title: 'Pesanan Diterima Pembeli 🎉', message: `Pembeli telah menerima paket "${transaction.productId.title}". Dana akan segera dicairkan Admin ke rekening Anda.`, type: 'TRANSACTION' });

        res.status(200).json({ success: true, message: 'Terima kasih telah mengonfirmasi penerimaan barang!' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getAllTransactions = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });
        
        const transactions = await Transaction.find()
            .populate('productId', 'title price images imageUrl')
            .populate('buyerId', 'name email bankName bankAccount bankAccountName') 
            .populate('sellerId', 'name bankName bankAccount bankAccountName qrisUrl campus') 
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.id;

        let purchases = await Transaction.find({ buyerId: userId })
            .populate('productId', 'title imageUrl images price') 
            .populate('sellerId', 'name campus profilePicture')
            .sort({ createdAt: -1 })
            .lean(); 

        let sales = await Transaction.find({ sellerId: userId })
            .populate('productId', 'title imageUrl images price')
            .populate('buyerId', 'name domisili profilePicture campus')
            .sort({ createdAt: -1 })
            .lean();

        for (let i = 0; i < purchases.length; i++) {
            let review = await Review.findOne({ transactionId: purchases[i]._id }).populate('buyerId', 'name profilePicture');
            
            if (!review && purchases[i].productId) {
                review = await Review.findOne({ 
                    productId: purchases[i].productId._id, 
                    buyerId: userId 
                }).populate('buyerId', 'name profilePicture');
            }
            purchases[i].review = review || null; 
        }

        res.status(200).json({ success: true, data: { purchases, sales } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.verifyCodPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        if (transaction.sellerId.toString() !== req.user.id) return res.status(403).json({ message: 'Ditolak: Hanya penjual yang bisa memverifikasi PIN ini' });
        if (transaction.status !== 'Dana Ditahan (Siap COD)') return res.status(400).json({ message: 'Status transaksi belum siap untuk COD' });
        if (transaction.codPin !== pin) return res.status(400).json({ message: 'PIN SALAH! Pastikan Anda meminta PIN yang benar dari pembeli.' });

        transaction.status = 'Selesai';
        await transaction.save();
        
        await Product.findByIdAndUpdate(transaction.productId, { status: 'Terjual', stock: 0 });
        const product = await Product.findByIdAndUpdate(transaction.productId, { status: 'Selesai' });
        const productTitle = product ? product.title : 'Barang';

        await Notification.create({ userId: transaction.buyerId, title: 'Transaksi Selesai 🎯', message: `Barang "${productTitle}" telah Anda terima. Jangan lupa berikan ulasan ke penjual untuk membantu reputasinya!`, type: 'TRANSACTION' });
        await Notification.create({ userId: transaction.sellerId, title: 'COD Berhasil 🎉', message: `PIN Benar! Dana penjualan "${productTitle}" akan segera diproses dan dicairkan oleh Admin ke rekening Anda.`, type: 'TRANSACTION' });

        res.status(200).json({ success: true, message: '✅ PIN Valid! Transaksi Selesai. Admin akan segera meneruskan dana ke rekening Anda.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.disburseFunds = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });

        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        if (transaction.status !== 'Selesai') return res.status(400).json({ message: 'Transaksi belum selesai!' });

        transaction.status = 'Dana Dicairkan';
        await transaction.save();

        const product = await Product.findById(transaction.productId);
        const productTitle = product ? product.title : 'Barang';

        await Notification.create({ userId: transaction.sellerId, title: 'Dana Telah Dicairkan 💰', message: `Hore! Dana penjualan "${productTitle}" sebesar Rp${(transaction.sellerIncome || transaction.price).toLocaleString('id-ID')} telah ditransfer Admin ke rekening Anda. Silakan cek mutasi Anda.`, type: 'TRANSACTION' });

        res.status(200).json({ success: true, message: 'Status berhasil diubah menjadi Dana Dicairkan!' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateShippingProgress = async (req, res) => {
    try {
        const { progress } = req.body;
        const transaction = await Transaction.findById(req.params.id);
        
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        if (transaction.sellerId.toString() !== req.user.id) return res.status(403).json({ message: 'Ditolak: Hanya penjual!' });
        if (transaction.status !== 'Dana Ditahan (Siap COD)') return res.status(400).json({ message: 'Transaksi tidak dalam fase pengemasan.' });
        
        transaction.shippingProgress = progress;
        await transaction.save();

        res.status(200).json({ success: true, message: 'Status pengerjaan berhasil diperbarui.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.requestRefund = async (req, res) => {
    try {
        const { title, reason } = req.body;
        const transaction = await Transaction.findById(req.params.id).populate('productId');
        
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
        if (transaction.buyerId.toString() !== req.user.id) return res.status(403).json({ message: 'Akses Ditolak.' });
        if (['Selesai', 'Dana Dicairkan', 'Refund Diajukan', 'Refund Diproses', 'Refund Selesai'].includes(transaction.status)) {
            return res.status(400).json({ message: 'Status transaksi tidak mendukung pembatalan.' });
        }

        transaction.status = 'Refund Diajukan';
        transaction.cancelTitle = title;
        transaction.cancelReason = reason;
        await transaction.save();

        await Notification.create({ userId: transaction.buyerId, title: 'Pengajuan Refund 🔄', message: `Permintaan batal untuk "${transaction.productId.title}" sedang ditinjau Admin.`, type: 'SYSTEM' });
        await Notification.create({ userId: transaction.sellerId, title: 'Pesanan Dibatalkan ❌', message: `Pembeli membatalkan pesanan "${transaction.productId.title}". Alasan: ${title}`, type: 'SYSTEM' });

        res.status(200).json({ success: true, message: 'Pengajuan refund berhasil dikirim ke Admin.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.processRefund = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });
        const transaction = await Transaction.findById(req.params.id).populate('productId');
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });

        transaction.status = 'Refund Diproses';
        await transaction.save();

        await Notification.create({ userId: transaction.buyerId, title: 'Refund Diproses ⏳', message: `Admin sedang memproses pengembalian dana 100% untuk "${transaction.productId.title}" ke rekening Anda.`, type: 'SYSTEM' });

        res.status(200).json({ success: true, message: 'Status diubah ke Refund Diproses' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.completeRefund = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });
        const transaction = await Transaction.findById(req.params.id).populate('productId');
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });

        transaction.status = 'Refund Selesai';
        await transaction.save();

        const product = await Product.findById(transaction.productId._id);
        if (product) {
            product.stock += 1;
            product.status = 'Tersedia';
            await product.save();
        }

        await Notification.create({ userId: transaction.buyerId, title: 'Refund Berhasil Dicairkan 💸', message: `Dana sebesar Rp${transaction.price.toLocaleString('id-ID')} telah ditransfer kembali ke rekening Anda.`, type: 'SYSTEM' });
        await Notification.create({ userId: transaction.sellerId, title: 'Stok Dikembalikan 📦', message: `Barang "${transaction.productId.title}" telah kembali tersedia di etalase toko Anda karena pesanan dibatalkan.`, type: 'SYSTEM' });

        res.status(200).json({ success: true, message: 'Refund selesai dan stok dikembalikan.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};