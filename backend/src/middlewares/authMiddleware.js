const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    // Cek apakah ada token di header (Bearer Token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // Decode token untuk mendapatkan ID User
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Simpan data user ke dalam request
            next();
        } catch (error) {
            res.status(401).json({ message: 'Sesi tidak valid atau telah berakhir. Silakan login ulang.' });
        }
    }
    if (!token) return res.status(401).json({ message: 'Akses ditolak, tidak ada token!' });
};

module.exports = { protect };