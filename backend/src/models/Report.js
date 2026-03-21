const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }, // Opsional, jika lapor dari transaksi
    title: { type: String, required: true },
    description: { type: String, required: true },
    evidenceImage: { type: String, required: true }, // URL gambar bukti
    status: { type: String, enum: ['Menunggu Review', 'Sedang Diproses', 'Selesai'], default: 'Menunggu Review' },
    adminNotes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);