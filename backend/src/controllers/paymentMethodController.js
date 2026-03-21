const PaymentMethod = require('../models/PaymentMethod');
const { uploadToCloudinary } = require('../middlewares/upload'); // <--- Tambahkan ini

exports.getPaymentMethods = async (req, res) => {
    try {
        const methods = await PaymentMethod.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: methods });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createPaymentMethod = async (req, res) => {
    try {
        const { bankName, accountNumber, ownerName } = req.body;
        
        // Cek jika ada file gambar yang diupload
        let qrImageUrl = null;
        if (req.file) {
            qrImageUrl = await uploadToCloudinary(req.file.buffer, 'qris_admin');
        }

        const method = await PaymentMethod.create({ 
            bankName, 
            accountNumber, 
            ownerName,
            qrImageUrl // Simpan URL gambar ke database
        });
        
        res.status(201).json({ success: true, data: method });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deletePaymentMethod = async (req, res) => {
    try {
        await PaymentMethod.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Rekening dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};