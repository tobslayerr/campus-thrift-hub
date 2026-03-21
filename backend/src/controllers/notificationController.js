const Notification = require('../models/Notification');

// Ambil semua notifikasi milik user yang login
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(30); // Ambil 30 terbaru agar tidak berat
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Tandai semua notifikasi menjadi "Sudah Dibaca"
exports.markAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ success: true, message: 'Notifikasi telah dibaca.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};