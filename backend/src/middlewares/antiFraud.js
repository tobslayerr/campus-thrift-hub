const antiFraudFilter = (req, res, next) => {
    // Ambil teks dari deskripsi barang atau pesan chat
    const textToCheck = req.body.description || req.body.message || "";

    // Regex untuk mendeteksi nomor HP (08xx), kata WA, OVO, Dana, dll
    const phoneRegex = /(08|\+628)\d{8,11}/g;
    const forbiddenWords = [/wa(hatsapp)?/i, /transfer langsung/i, /tf langsung/i, /ovo/i, /dana/i, /shopeepay/i];

    let isFraud = false;

    // Cek nomor HP
    if (phoneRegex.test(textToCheck)) isFraud = true;

    // Cek kata terlarang
    forbiddenWords.forEach(word => {
        if (word.test(textToCheck)) isFraud = true;
    });

    if (isFraud) {
        return res.status(403).json({
            success: false,
            message: "⚠️ Teks diblokir! Dilarang menyertakan nomor HP atau mengajak transaksi di luar sistem Escrow Campus Thrift Hub."
        });
    }

    // Jika aman, lanjut ke proses berikutnya
    next();
};

module.exports = antiFraudFilter;