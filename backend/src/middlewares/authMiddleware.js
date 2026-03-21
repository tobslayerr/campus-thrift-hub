const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = await User.findById(decoded.id).select('-password');
            
            // FITUR BARU: Update waktu terakhir aktif setiap kali user melakukan aksi
            if (req.user) {
                req.user.lastActive = Date.now();
                await req.user.save();
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Tidak ada otorisasi, token gagal' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Tidak ada otorisasi, tidak ada token' });
    }
};