const Report = require('../models/Report');
const Notification = require('../models/Notification');
const User = require('../models/User'); // 👤 IMPORT USER UNTUK AMBIL EMAIL
const { uploadToCloudinary } = require('../middlewares/upload');
const sendEmail = require('../utils/sendEmail'); // 📧 IMPORT SEND EMAIL

exports.createReport = async (req, res) => {
    try {
        const { reportedUserId, transactionId, title, description } = req.body;
        const reporterId = req.user.id;

        if (!req.file) return res.status(400).json({ message: 'Bukti foto wajib dilampirkan!' });

        const evidenceImage = await uploadToCloudinary(req.file.buffer, 'reports');

        const report = await Report.create({
            reporterId, reportedUserId, transactionId, title, description, evidenceImage
        });

        // 🌟 AMBIL DATA PELAPOR UNTUK DIKIRIM EMAIL & NOTIFIKASI
        const reporter = await User.findById(reporterId);

        if (reporter) {
            // 1. Notifikasi In-App (Konfirmasi Laporan Diterima)
            await Notification.create({
                userId: reporterId,
                title: 'Laporan Diterima 🛡️',
                message: `Laporan Anda mengenai "${title}" telah masuk ke sistem kami dan sedang menunggu antrean tinjauan Admin.`,
                type: 'REPORT'
            });

            // 2. Email Konfirmasi (Tanda Terima Laporan)
            if (reporter.email) {
                const emailHtml = `
                    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; max-w: 600px; margin: 0 auto;">
                        <h2 style="color: #dc2626; margin-top: 0;">Laporan Berhasil Dikirim 🛡️</h2>
                        <p style="color: #334155; font-size: 16px;">Halo <strong>${reporter.name}</strong>,</p>
                        <p style="color: #334155; font-size: 16px;">Terima kasih telah membantu menjaga komunitas Campus Thrift Hub tetap aman dan nyaman.</p>
                        <p style="color: #334155; font-size: 16px;">Kami telah menerima laporan Anda dengan rincian berikut:</p>
                        
                        <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #fecaca; color: #475569;">
                            <p style="margin: 0 0 10px 0;"><strong>Jenis Pelanggaran:</strong><br/> ${title}</p>
                            <p style="margin: 0;"><strong>Deskripsi Kejadian:</strong><br/> ${description}</p>
                        </div>
                        
                        <p style="color: #334155; font-size: 14px;">Tim Otoritas Admin kami akan meninjau bukti yang Anda lampirkan dan mengambil tindakan tegas jika terbukti melanggar aturan. Anda akan menerima email pembaruan jika status laporan Anda berubah.</p>
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Sistem Keamanan Campus Thrift Hub.</p>
                    </div>
                `;
                
                sendEmail({
                    email: reporter.email,
                    subject: `Tanda Terima Laporan: ${title} - Campus Thrift Hub`,
                    message: emailHtml
                }).catch(err => console.error("Gagal kirim email laporan dibuat:", err));
            }
        }

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
            .populate('reportedUserId', 'name email campus isBanned')
            .populate('transactionId', 'status price transactionId')
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
        // Kita perlu populate reporterId untuk mengambil emailnya
        const report = await Report.findByIdAndUpdate(req.params.id, { status, adminNotes }, { new: true })
            .populate('reporterId', 'name email');
        
        if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan' });

        // 🔥 LOGIKA NOTIFIKASI & EMAIL STATUS LAPORAN 🔥
        let notifTitle = '';
        let notifMessage = '';
        let emailColor = '#0ea5e9'; // Default blue

        if (status === 'Sedang Diproses') {
            notifTitle = 'Laporan Diproses 🔍';
            notifMessage = `Laporan Anda terkait "${report.title}" sedang ditinjau dan ditindaklanjuti oleh tim Admin.`;
            emailColor = '#f59e0b'; // Amber
        } else if (status === 'Selesai') {
            notifTitle = 'Laporan Selesai Ditangani 🏁';
            notifMessage = `Laporan Anda telah selesai diproses. Catatan Admin: "${adminNotes || 'Terima kasih telah melapor.'}"`;
            emailColor = '#16a34a'; // Green
        }

        // Jika ada perubahan status yang penting, kirim notifikasi ke In-App dan Email
        if (notifTitle && report.reporterId) {
            
            // 1. Notifikasi In-App
            await Notification.create({
                userId: report.reporterId._id,
                title: notifTitle,
                message: notifMessage,
                type: 'REPORT'
            });

            // 2. Notifikasi Email
            if (report.reporterId.email) {
                const emailHtml = `
                    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; max-w: 600px; margin: 0 auto;">
                        <h2 style="color: ${emailColor}; margin-top: 0;">Update Status Laporan 📋</h2>
                        <p style="color: #334155; font-size: 16px;">Halo <strong>${report.reporterId.name}</strong>,</p>
                        <p style="color: #334155; font-size: 16px;">Terdapat pembaruan pada laporan Anda mengenai kasus <strong>"${report.title}"</strong>.</p>
                        
                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0; color: #475569;">
                            <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Status Laporan:</strong> <span style="color: ${emailColor}; font-weight: black; text-transform: uppercase;">${status}</span></p>
                            ${adminNotes ? `<p style="margin: 0;"><strong>Catatan Admin Kepada Anda:</strong><br/> <span style="font-style: italic;">"${adminNotes}"</span></p>` : ''}
                        </div>
                        
                        <p style="color: #334155; font-size: 14px;">Terima kasih atas partisipasi aktif Anda dalam menjaga keamanan platform jual-beli ini.</p>
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Sistem Otoritas Admin - Campus Thrift Hub.</p>
                    </div>
                `;

                sendEmail({
                    email: report.reporterId.email,
                    subject: `${notifTitle} - Campus Thrift Hub`,
                    message: emailHtml
                }).catch(err => console.error("Gagal kirim email update laporan:", err));
            }
        }
        
        res.status(200).json({ success: true, data: report, message: 'Status laporan diperbarui.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};