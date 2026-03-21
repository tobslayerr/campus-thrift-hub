const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// 1. Simpan file sementara di Memory (RAM) server sebelum dikirim ke Cloudinary
const storage = multer.memoryStorage();

// 2. Filter hanya boleh upload gambar
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar (JPG/PNG) yang diperbolehkan!'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // Maksimal 5MB

// 3. Fungsi pembantu untuk upload Stream ke Cloudinary
const uploadToCloudinary = (buffer, folderName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: `campus_thrift/${folderName}` },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url); // Kembalikan URL gambarnya
            }
        );
        stream.end(buffer);
    });
};

module.exports = { upload, uploadToCloudinary };