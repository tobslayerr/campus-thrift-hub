const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const User = require('../models/User'); // Pastikan User diimport untuk populate email
const { uploadToCloudinary } = require('../middlewares/upload');
const sendEmail = require('../utils/sendEmail'); // 📧 IMPORT FUNGSI EMAIL

exports.checkout = async (req, res) => {
    try {
        const { 
            productId, 
            paymentMethod, 
            deliveryMethod, 
            buyerAddress, 
            buyerPhone, 
            buyerLocationPoint, 
            codMeetingPoint 
        } = req.body;
        const buyerId = req.user.id;

        const product = await Product.findById(productId).populate('sellerId', 'name email'); // Populate email penjual
        if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan' });

        const buyer = await User.findById(buyerId); // Ambil data pembeli

        if (product.sellerId._id.toString() === buyerId) {
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

        const txIdStr = generateTxId();

        const transaction = await Transaction.create({
            transactionId: txIdStr,
            productId: productId,
            buyerId: buyerId,
            sellerId: product.sellerId._id,
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
            codMeetingPoint 
        });

        product.stock -= 1;
        product.status = product.stock === 0 ? 'Menunggu Pembayaran' : 'Tersedia';
        await product.save();

        // 🌟 NOTIFIKASI IN-APP & EMAIL 🌟
        if (deliveryMethod === 'Pengiriman') {
            await Notification.create({ userId: buyerId, title: 'Pesanan Dibuat! 🛒', message: `Checkout "${product.title}" berhasil. Sistem Ongkir adalah DFOD (Ongkos kirim dibayar tunai ke kurir saat paket sampai). Menunggu verifikasi admin.`, type: 'TRANSACTION' });
            await Notification.create({ userId: product.sellerId._id, title: 'Pesanan Baru Masuk! 📦', message: `Barang Anda "${product.title}" telah dipesan via Ekspedisi. Harap bersiap mengirim paket dengan layanan DFOD (Ongkir Bayar Tujuan). Menunggu admin verifikasi uang.`, type: 'TRANSACTION' });
        } else {
            await Notification.create({ userId: buyerId, title: 'Pesanan Dibuat! 🛒', message: `Checkout "${product.title}" via COD di ${codMeetingPoint} berhasil. Menunggu verifikasi pembayaran oleh Admin.`, type: 'TRANSACTION' });
            await Notification.create({ userId: product.sellerId._id, title: 'Pesanan Baru Masuk! 🤝', message: `Barang Anda "${product.title}" telah dipesan via COD. Titik temu di: ${codMeetingPoint}. Menunggu admin memverifikasi pembayaran.`, type: 'TRANSACTION' });
        }

        // 📧 KIRIM EMAIL KE PEMBELI (Bukti Checkout)
        if (buyer.email) {
            sendEmail({
                email: buyer.email,
                subject: `Pesanan Berhasil Dibuat: ${product.title}`,
                message: `
                    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; max-w: 600px; margin: 0 auto;">
                        <h2 style="color: #00478F;">Pesanan Dibuat! (ID: ${txIdStr})</h2>
                        <p>Halo <strong>${buyer.name}</strong>,</p>
                        <p>Terima kasih telah berbelanja. Checkout Anda untuk barang <strong>"${product.title}"</strong> seharga <strong>Rp${product.price.toLocaleString('id-ID')}</strong> telah kami terima beserta bukti pembayarannya.</p>
                        <p>Saat ini, Admin sedang melakukan verifikasi mutasi rekening. Anda akan menerima notifikasi jika uang sudah masuk ke sistem Escrow kami.</p>
                        ${deliveryMethod === 'Pengiriman' ? '<p style="color: #d97706; font-weight: bold;">INFO PENTING: Ongkos kirim (Ekspedisi) tidak termasuk dalam tagihan. Ongkir harus dibayar secara tunai ke kurir saat paket tiba di alamat Anda (Sistem DFOD).</p>' : ''}
                    </div>
                `
            }).catch(e => console.error("Email Buyer Error:", e));
        }

        // 📧 KIRIM EMAIL KE PENJUAL (Info Ada yang beli)
        if (product.sellerId.email) {
            sendEmail({
                email: product.sellerId.email,
                subject: `Ada Pesanan Baru Masuk: ${product.title}!`,
                message: `
                    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; max-w: 600px; margin: 0 auto;">
                        <h2 style="color: #FF9500;">Pesanan Baru Masuk! 🎉</h2>
                        <p>Halo <strong>${product.sellerId.name}</strong>,</p>
                        <p>Kabar baik! Barang Anda <strong>"${product.title}"</strong> baru saja dibeli.</p>
                        <p>Pembeli telah mengirimkan bukti transfer ke rekening Admin. <strong>Harap jangan memproses pengiriman/COD dulu sebelum Admin memverifikasi dana tersebut.</strong> Tunggu notifikasi selanjutnya dari sistem.</p>
                        ${deliveryMethod === 'Pengiriman' ? '<p>Metode: Ekspedisi (DFOD/Ongkir Bayar Tujuan).</p>' : `<p>Metode: COD (Ketemuan di ${codMeetingPoint}).</p>`}
                    </div>
                `
            }).catch(e => console.error("Email Seller Error:", e));
        }

        res.status(201).json({ success: true, transaction, message: 'Checkout berhasil, menunggu admin.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak. Hanya Admin!' });

        const { status } = req.body; 
        // 🌟 Populate email agar bisa kirim email 🌟
        const transaction = await Transaction.findById(req.params.id)
            .populate('productId', 'title price')
            .populate('buyerId', 'name email')
            .populate('sellerId', 'name email');

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
                // 🌟 NOTIF & EMAIL: UANG DIVERIFIKASI (SIAP PROSES) 🌟
                if (transaction.deliveryMethod === 'Pengiriman') {
                    await Notification.create({ userId: transaction.buyerId._id, title: 'Pembayaran Diverifikasi 💸', message: `Pembayaran "${productTitle}" diverifikasi Admin. Penjual akan segera memproses pengiriman. Siapkan uang tunai untuk bayar Ongkos Kirim (DFOD) ke kurir nanti.`, type: 'TRANSACTION' });
                    await Notification.create({ userId: transaction.sellerId._id, title: 'Pesanan Siap Dikirim! 🚚', message: `Uang pembelian "${productTitle}" sudah diamankan sistem. Silakan bawa barang ke ekspedisi, MINTA LAYANAN DFOD (Ongkir bayar tujuan), lalu input resi di Dashboard!`, type: 'TRANSACTION' });

                    // 📧 Email Penjual
                    if (transaction.sellerId.email) {
                        sendEmail({
                            email: transaction.sellerId.email,
                            subject: `Uang Telah Diverifikasi - Segera Kirim: ${productTitle}`,
                            message: `
                                <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; max-w: 600px; margin: 0 auto;">
                                    <h2 style="color: #00478F;">Uang Sudah Diamankan Admin! 🤝</h2>
                                    <p>Halo <strong>${transaction.sellerId.name}</strong>,</p>
                                    <p>Dana dari pembeli untuk barang <strong>"${productTitle}"</strong> telah berhasil diverifikasi dan ditahan oleh sistem Escrow kami.</p>
                                    <p>Silakan kemas barang dan kirimkan melalui Ekspedisi pilihan Anda ke alamat pembeli yang tertera di aplikasi. <strong>PENTING: Gunakan layanan Bayar Tujuan (DFOD)</strong> untuk ongkos kirimnya.</p>
                                    <p>Setelah mengirim, wajib input Nomor Resi di aplikasi agar dana bisa dicairkan setelah barang sampai.</p>
                                </div>
                            `
                        }).catch(e => console.error(e));
                    }
                } else {
                    const meetingInfo = transaction.codMeetingPoint ? ` di ${transaction.codMeetingPoint}` : '';
                    await Notification.create({ userId: transaction.buyerId._id, title: 'Pembayaran Diverifikasi 💸', message: `Pembayaran Anda untuk "${productTitle}" telah diverifikasi Admin. Silakan janjian COD dengan penjual${meetingInfo}!`, type: 'TRANSACTION' });
                    await Notification.create({ userId: transaction.sellerId._id, title: 'Uang Telah Diamankan 🤝', message: `Uang pembelian "${productTitle}" sudah ditahan sistem. Silakan ketemuan${meetingInfo} dan minta 4-Digit PIN pembeli untuk pencairan.`, type: 'TRANSACTION' });
                    
                    // 📧 Email Penjual
                    if (transaction.sellerId.email) {
                        sendEmail({
                            email: transaction.sellerId.email,
                            subject: `Uang Telah Diverifikasi - Segera COD: ${productTitle}`,
                            message: `
                                <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; max-w: 600px; margin: 0 auto;">
                                    <h2 style="color: #00478F;">Uang Sudah Diamankan Admin! 🤝</h2>
                                    <p>Halo <strong>${transaction.sellerId.name}</strong>,</p>
                                    <p>Dana dari pembeli untuk barang <strong>"${productTitle}"</strong> telah berhasil diverifikasi dan ditahan oleh sistem Escrow kami.</p>
                                    <p>Silakan ketemuan (COD) dengan pembeli${meetingInfo}. <strong>PENTING: Mintalah 4-Digit PIN dari pembeli</strong> saat menyerahkan barang, lalu masukkan PIN tersebut di aplikasi untuk mencairkan dana Anda.</p>
                                </div>
                            `
                        }).catch(e => console.error(e));
                    }
                }
            }
        } else if (status === 'Sengketa') {
            await Notification.create({ userId: transaction.buyerId._id, title: 'Transaksi Bersengketa ⚠️', message: `Transaksi untuk "${productTitle}" sedang ditangguhkan karena ada masalah/laporan. Admin sedang meninjau kasus ini.`, type: 'TRANSACTION' });
            await Notification.create({ userId: transaction.sellerId._id, title: 'Transaksi Bersengketa ⚠️', message: `Pencairan dana untuk "${productTitle}" ditangguhkan karena ada laporan sengketa. Admin akan meninjau kasus ini.`, type: 'TRANSACTION' });
        }

        res.status(200).json({ success: true, message: `Status diperbarui menjadi: ${status}` });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.shipItem = async (req, res) => {
    try {
        const { shippingCourier, shippingResi, shippingCost } = req.body;
        const transaction = await Transaction.findById(req.params.id)
            .populate('productId', 'title')
            .populate('buyerId', 'name email'); // Populate pembeli
        
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        if (transaction.sellerId.toString() !== req.user.id) return res.status(403).json({ message: 'Ditolak: Hanya penjual!' });
        if (transaction.status !== 'Dana Ditahan (Siap COD)') return res.status(400).json({ message: 'Transaksi belum siap dikirim' });

        transaction.shippingCourier = shippingCourier;
        transaction.shippingResi = shippingResi;
        transaction.shippingCost = shippingCost || 0; 
        transaction.status = 'Barang Dikirim';
        await transaction.save();

        const pTitle = transaction.productId ? transaction.productId.title : 'Barang';
        await Notification.create({ userId: transaction.buyerId._id, title: 'Barang Telah Dikirim 🚚', message: `Pesanan "${pTitle}" telah dikirim via ${shippingCourier}. Resi: ${shippingResi}. Harap konfirmasi jika barang sudah sampai.`, type: 'TRANSACTION' });

        // 📧 EMAIL KE PEMBELI (RESI PENGIRIMAN)
        if (transaction.buyerId.email) {
            sendEmail({
                email: transaction.buyerId.email,
                subject: `Pesanan Dikirim: ${pTitle} 🚚`,
                message: `
                    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; max-w: 600px; margin: 0 auto;">
                        <h2 style="color: #0ea5e9;">Pesanan Anda Sedang Dalam Perjalanan!</h2>
                        <p>Halo <strong>${transaction.buyerId.name}</strong>,</p>
                        <p>Penjual telah menyerahkan pesanan <strong>"${pTitle}"</strong> Anda ke ekspedisi.</p>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p style="margin: 5px 0;"><strong>Kurir:</strong> ${shippingCourier}</p>
                            <p style="margin: 5px 0;"><strong>Nomor Resi:</strong> ${shippingResi}</p>
                            <p style="margin: 5px 0; color: #d97706;"><strong>Tagihan Ongkir (DFOD):</strong> Rp${(shippingCost || 0).toLocaleString('id-ID')}</p>
                        </div>
                        <p>Harap siapkan uang tunai yang pas untuk diserahkan ke kurir saat paket tiba. Jika barang sudah diterima dalam kondisi baik, segera klik <strong>"Konfirmasi Terima Barang"</strong> di aplikasi agar uang dapat diteruskan ke penjual.</p>
                    </div>
                `
            }).catch(e => console.error(e));
        }

        res.status(200).json({ success: true, message: 'Status berhasil diubah menjadi Barang Dikirim.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.confirmDelivery = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('productId', 'title')
            .populate('sellerId', 'name email'); // Populate penjual
        
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        if (transaction.buyerId.toString() !== req.user.id) return res.status(403).json({ message: 'Ditolak: Hanya pembeli!' });
        if (transaction.status !== 'Barang Dikirim') return res.status(400).json({ message: 'Barang belum dikirim oleh penjual.' });

        transaction.status = 'Selesai';
        transaction.shippingProgress = 'Barang Diterima Pembeli';
        await transaction.save();

        const pTitle = transaction.productId ? transaction.productId.title : 'Barang';
        await Product.findByIdAndUpdate(transaction.productId, { status: 'Terjual', stock: 0 });

        await Notification.create({ userId: transaction.sellerId._id, title: 'Pesanan Diterima Pembeli 🎉', message: `Pembeli telah menerima paket "${pTitle}". Dana akan segera dicairkan Admin ke rekening Anda.`, type: 'TRANSACTION' });

        // 📧 EMAIL KE PENJUAL (DANA SIAP CAIR)
        if (transaction.sellerId.email) {
            sendEmail({
                email: transaction.sellerId.email,
                subject: `Barang Diterima Pembeli: ${pTitle} 🎉`,
                message: `
                    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; max-w: 600px; margin: 0 auto;">
                        <h2 style="color: #16a34a;">Transaksi Berhasil Selesai!</h2>
                        <p>Halo <strong>${transaction.sellerId.name}</strong>,</p>
                        <p>Pembeli telah mengonfirmasi bahwa mereka sudah menerima barang <strong>"${pTitle}"</strong> dengan baik.</p>
                        <p>Sistem saat ini sedang memproses pencairan dana bersih sebesar <strong>Rp${(transaction.sellerIncome || transaction.price).toLocaleString('id-ID')}</strong> ke rekening/QRIS Anda. Mohon tunggu maksimal 1x24 Jam kerja.</p>
                    </div>
                `
            }).catch(e => console.error(e));
        }

        res.status(200).json({ success: true, message: 'Terima kasih telah mengonfirmasi penerimaan barang!' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.disburseFunds = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });

        const transaction = await Transaction.findById(req.params.id)
            .populate('productId', 'title')
            .populate('sellerId', 'name email'); // Populate penjual
            
        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        if (transaction.status !== 'Selesai') return res.status(400).json({ message: 'Transaksi belum selesai!' });

        transaction.status = 'Dana Dicairkan';
        await transaction.save();

        const productTitle = transaction.productId ? transaction.productId.title : 'Barang';
        const netIncome = transaction.sellerIncome || transaction.price;

        await Notification.create({ userId: transaction.sellerId._id, title: 'Dana Telah Dicairkan 💰', message: `Hore! Dana penjualan "${productTitle}" sebesar Rp${netIncome.toLocaleString('id-ID')} telah ditransfer Admin ke rekening Anda. Silakan cek mutasi Anda.`, type: 'TRANSACTION' });

        // 📧 EMAIL KE PENJUAL (BUKTI PENCAIRAN ADMIN)
        if (transaction.sellerId.email) {
            sendEmail({
                email: transaction.sellerId.email,
                subject: `Pencairan Dana Berhasil: ${productTitle} 💰`,
                message: `
                    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; max-w: 600px; margin: 0 auto;">
                        <h2 style="color: #00478F;">Dana Penjualan Anda Telah Dicairkan!</h2>
                        <p>Halo <strong>${transaction.sellerId.name}</strong>,</p>
                        <p>Admin Campus Thrift Hub baru saja mentransfer dana bersih penjualan barang <strong>"${productTitle}"</strong>.</p>
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #16a34a;">Rp${netIncome.toLocaleString('id-ID')}</p>
                        </div>
                        <p>Silakan cek mutasi rekening atau e-Wallet yang Anda daftarkan di Profil Anda. Terima kasih telah berjualan di sistem kami!</p>
                    </div>
                `
            }).catch(e => console.error(e));
        }

        res.status(200).json({ success: true, message: 'Status berhasil diubah menjadi Dana Dicairkan!' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// ... (Sisa fungsi lain seperti getAllTransactions, getMyTransactions, verifyCodPin, updateShippingProgress, requestRefund, processRefund, completeRefund tetap SAMA) ...

// Saya tambahkan verifyCodPin karena juga mentrigger uang cair
exports.verifyCodPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const transaction = await Transaction.findById(req.params.id)
            .populate('productId', 'title')
            .populate('sellerId', 'name email')
            .populate('buyerId', 'name email');

        if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        if (transaction.sellerId._id.toString() !== req.user.id) return res.status(403).json({ message: 'Ditolak: Hanya penjual yang bisa memverifikasi PIN ini' });
        if (transaction.status !== 'Dana Ditahan (Siap COD)') return res.status(400).json({ message: 'Status transaksi belum siap untuk COD' });
        if (transaction.codPin !== pin) return res.status(400).json({ message: 'PIN SALAH! Pastikan Anda meminta PIN yang benar dari pembeli.' });

        transaction.status = 'Selesai';
        await transaction.save();
        
        await Product.findByIdAndUpdate(transaction.productId._id, { status: 'Terjual', stock: 0 });
        const productTitle = transaction.productId ? transaction.productId.title : 'Barang';

        await Notification.create({ userId: transaction.buyerId._id, title: 'Transaksi Selesai 🎯', message: `Barang "${productTitle}" telah Anda terima. Jangan lupa berikan ulasan ke penjual untuk membantu reputasinya!`, type: 'TRANSACTION' });
        await Notification.create({ userId: transaction.sellerId._id, title: 'COD Berhasil 🎉', message: `PIN Benar! Dana penjualan "${productTitle}" akan segera diproses dan dicairkan oleh Admin ke rekening Anda.`, type: 'TRANSACTION' });

        // 📧 EMAIL KE PENJUAL (DANA COD SIAP CAIR)
        if (transaction.sellerId.email) {
            sendEmail({
                email: transaction.sellerId.email,
                subject: `COD Berhasil & Dana Siap Cair: ${productTitle} 🎉`,
                message: `
                    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; max-w: 600px; margin: 0 auto;">
                        <h2 style="color: #16a34a;">Verifikasi COD Berhasil!</h2>
                        <p>Halo <strong>${transaction.sellerId.name}</strong>,</p>
                        <p>PIN yang Anda masukkan benar. Sistem mendeteksi bahwa pembeli telah menerima barang <strong>"${productTitle}"</strong>.</p>
                        <p>Sistem saat ini sedang memproses pencairan dana bersih sebesar <strong>Rp${(transaction.sellerIncome || transaction.price).toLocaleString('id-ID')}</strong> ke rekening/QRIS Anda. Mohon tunggu maksimal 1x24 Jam kerja.</p>
                    </div>
                `
            }).catch(e => console.error(e));
        }

        res.status(200).json({ success: true, message: '✅ PIN Valid! Transaksi Selesai. Admin akan segera meneruskan dana ke rekening Anda.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// ... copy fungsi lain (getAllTransactions, getMyTransactions, progress, dll) persis seperti file lama Anda
exports.getAllTransactions = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak.' });
        const transactions = await Transaction.find()
            .populate('productId', 'title price images imageUrl')
            .populate('buyerId', 'name email bankName bankAccount bankAccountName') 
            .populate('sellerId', 'name bankName bankAccount bankAccountName qrisUrl campus') 
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: transactions });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
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