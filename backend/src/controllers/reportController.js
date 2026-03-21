const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { uploadToCloudinary } = require('../middlewares/upload');

exports.createReport = async (req, res) => {
    try {
        const { reportedUserId, transactionId, title, description } = req.body;
        const reporterId = req.user.id;

        if (!req.file) return res.status(400).json({ message: 'Bukti foto wajib dilampirkan!' });

        const evidenceImage = await uploadToCloudinary(req.file.buffer, 'reports');

        const report = await Report.create({
            reporterId, reportedUserId, transactionId, title, description, evidenceImage
        });

        res.status(201).json({ success: true, data: report, message: 'Laporan berhasil dikirim ke Admin.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAllReports = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Hanya Admin!' });
        
        const reports = await Report.find()
            .populate('reporterId', 'name email')
            .populate('reportedUserId', 'name email')
            .populate('transactionId', 'status price')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Hanya Admin!' });
        
        const { status, adminNotes } = req.body;
        const report = await Report.findByIdAndUpdate(req.params.id, { status, adminNotes }, { new: true });
        
        // 🔥 LOGIKA NOTIFIKASI STATUS LAPORAN 🔥
        let notifTitle = '';
        let notifMessage = '';

        if (status === 'Sedang Diproses') {
            notifTitle = 'Laporan Diproses 🔍';
            notifMessage = `Laporan Anda terkait "${report.title}" sedang ditinjau dan ditindaklanjuti oleh tim Admin.`;
        } else if (status === 'Selesai') {
            notifTitle = 'Laporan Selesai Ditangani 🏁';
            notifMessage = `Laporan Anda telah selesai diproses. Catatan Admin: "${adminNotes || 'Terima kasih telah melapor.'}"`;
        }

        // Jika ada perubahan status yang penting, kirim notifikasi ke HP pelapor
        if (notifTitle) {
            await Notification.create({
                userId: report.reporterId,
                title: notifTitle,
                message: notifMessage,
                type: 'REPORT'
            });
        }
        
        res.status(200).json({ success: true, data: report, message: 'Status laporan diperbarui.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
