const antiFraudFilter = (req, res, next) => {
    const textToCheck = req.body.description || req.body.message || req.body.text || "";

    if (!textToCheck) return next();

    let isFraud = false;
    const t = textToCheck.toLowerCase();

    // 1. Deteksi Nomor HP (Sangat Ketat)
    const phoneRegex = /(?:\+\s*62|62|0)[\s\-.]*8[0-9]{1,2}[\s\-.]?[0-9]{3,4}[\s\-.]?[0-9]{3,4}/g;
    
    // =========================================================================
    // 2. LOGIKA BARU: DETEKSI DUA FAKTOR (NAMA BANK/WALLET + ANGKA REKENING)
    // =========================================================================
    // Cek apakah ada minimal 5 angka berdekatan (boleh dipisah spasi/titik/koma/strip)
    const hasFiveDigits = /(\d[\s\-\.,]*){5,}/.test(t);
    
    // Cek apakah ada penyebutan nama bank, e-wallet, atau kata rekening
    const hasBankKeyword = /\b(rek|rekening|norek|bca|bni|bri|mandiri|bsi|cimb|danamon|permata|mega|bjb|gopay|gpay|dana|ovo|shopeepay|spay|linkaja)\b/i.test(t);

    // JIKA ADA KATA BANK/REKENING && ADA 5 ANGKA -> PASTI MAU TRANSFER DI LUAR! BLOKIR!
    if (hasBankKeyword && hasFiveDigits) {
        isFraud = true;
    }

    // =========================================================================
    // 3. DETEKSI AJAKAN PINDAH PLATFORM ATAU KIRIM NOMOR SECARA LANGSUNG
    // =========================================================================
    const forbiddenPatterns = [
        /\b(pindah|lanjut|lewat|chat|hubungi)\s*(aja\s*)?(ke|di|via)?\s*(wa|whatsapp|w a|ig|instagram|tele|telegram|line)\b/i,
        /\b(ini|ni|nih|nomor|no)\s*(wa|whatsapp|w a|watsap)\b/i,
        /\b(wa|whatsapp|w a|w\.a|watsap|wea)\b/i,
        /\b(shopee|tokopedia|lazada|bukalapak|tiktok)\b/i
    ];

    if (!isFraud && (phoneRegex.test(t) || forbiddenPatterns.some(pattern => pattern.test(t)))) {
        isFraud = true;
    }

    if (isFraud) {
        return res.status(403).json({
            success: false,
            message: "⚠️ Teks diblokir! Dilarang menyertakan nomor WA, Rekening, atau mengajak transaksi di luar sistem Escrow Campus Thrift Hub."
        });
    }

    next();
};

module.exports = antiFraudFilter;