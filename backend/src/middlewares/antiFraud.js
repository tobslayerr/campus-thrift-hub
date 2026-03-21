const antiFraudFilter = (req, res, next) => {
    const textToCheck = req.body.description || req.body.message || req.body.text || "";

    if (!textToCheck) return next();

    let isFraud = false;

    // 1. Regex Nomor HP 
    const phoneRegex = /(?:\+\s*62|62|0)[\s\-.]*8[0-9]{1,2}[\s\-.]?[0-9]{3,4}[\s\-.]?[0-9]{3,4}/g;

    // 2. Daftar Kata Terlarang & Pola Rekening Pintar
    const forbiddenPatterns = [
        /\b(pindah|lanjut|lewat|chat|hubungi)\s*(aja\s*)?(ke|di|via)?\s*(wa|whatsapp|w a|ig|instagram|tele|telegram|line)\b/i,
        /\b(ini|ni|nih|nomor|no)\s*(wa|whatsapp|w a|watsap)\b/i,
        /\b(wa|whatsapp|w a|w\.a|watsap|wea)\b/i,
        
        // 🔥 REGEX BARU: Menangkap "gpay saja 03231232" atau "bni ini masi tembus 123456"
        // Penjelasan: Cari nama bank/wallet, lalu abaikan 0-30 karakter apapun di tengahnya, asalkan berujung pada 5 digit angka.
        /\b(rek|rekening|norek|bca|bni|bri|mandiri|bsi|cimb|danamon|permata|mega|bjb|gopay|gpay|dana|ovo|shopeepay|spay|linkaja)\b.{0,30}?\d{5,}/i,

        /\b(transfer|tf)\s+(langsung|sekarang|aja|ke|rek|rekening|bank)\b/i,
        /\b(minta|bagi|kirim)\s+(rek|rekening|norek)\b/i,
        /\b(via|tf|transfer|pake|pakai|ke|bayar|topup|top\s?up)\s+(dana|ovo|gopay|gpay|shopeepay|spay|linkaja)\b/i,
        /\b(shopee|tokopedia|lazada|bukalapak|tiktok)\b/i
    ];

    if (phoneRegex.test(textToCheck) || forbiddenPatterns.some(p => p.test(textToCheck))) {
        // BLOKIR SEPENUHNYA! Jangan diganti teksnya, langsung tolak requestnya.
        return res.status(403).json({
            success: false,
            message: "⚠️ Teks diblokir! Dilarang menyertakan nomor WA, Rekening, atau mengajak transaksi di luar sistem Escrow Campus Thrift Hub."
        });
    }

    next();
};

module.exports = antiFraudFilter;