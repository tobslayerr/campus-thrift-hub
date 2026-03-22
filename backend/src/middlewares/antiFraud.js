const antiFraudFilter = (req, res, next) => {
    let textToCheck = req.body.description || req.body.message || req.body.text || req.body.title || "";

    if (!textToCheck) return next();

    let isFraud = false;
    const t = textToCheck.toLowerCase();

    // =========================================================================
    // 0. NORMALISASI TEKS (HILANGKAN SPASI & KARAKTER KHUSUS)
    // Untuk mendeteksi angka yang disamarkan: "b n i : 1.2.3.4.5" -> "bni12345"
    // =========================================================================
    const normalizedText = t.replace(/[^a-z0-9]/g, '');

    // =========================================================================
    // 1. DETEKSI NOMOR HP / WHATSAPP (Sangat Ketat pada Teks Normal & Teks Asli)
    // =========================================================================
    // Deteksi nomor berawalan 08 atau 628 (minimal 10 digit, maksimal 14 digit) di teks yang sudah dihilangkan spasinya
    const phoneRegexNormalized = /(?:08|628)\d{8,12}/;
    
    // Deteksi nomor HP dengan berbagai pemisah di teks asli
    const phoneRegexOriginal = /(?:\+\s*62|62|0)[\s\-.]*8[0-9]{1,2}[\s\-.]?[0-9]{3,4}[\s\-.]?[0-9]{3,4}/;

    if (phoneRegexNormalized.test(normalizedText) || phoneRegexOriginal.test(t)) {
        isFraud = true;
    }

    // =========================================================================
    // 2. DETEKSI REKENING & TRANSFER DI LUAR (Kombinasi Kata + Angka)
    // =========================================================================
    
    // Cek kata kunci Bank / E-Wallet di teks asli (untuk menghindari false positive kata yang nyambung)
    const hasBankKeyword = /\b(rek|rekening|norek|bca|bni|bri|mandiri|bsi|cimb|danamon|permata|mega|bjb|gopay|gpay|dana|ovo|shopeepay|spay|linkaja|jenius|sakuku|tf|transfer)\b/i.test(t);

    // Cek apakah ada deretan angka (minimal 8 digit) di teks yang sudah dinormalisasi (rekening bank biasanya 10-15 digit, e-wallet 10-13 digit)
    const hasLongDigits = /\d{8,}/.test(normalizedText);

    // BLOKIR JIKA: Ada sebutan bank/transfer DAN ada deretan angka panjang
    if (hasBankKeyword && hasLongDigits) {
        isFraud = true;
    }

    // =========================================================================
    // 3. DETEKSI FRASA TRANSAKSI PRIBADI / PENIPUAN (Tanpa Angka)
    // =========================================================================
    const fraudPhrases = [
        // Ajakan transfer di luar
        /\b(bayar|transfer|tf|trf)\s*(ke|lewat|via|pake|pakai|langsung)?\s*(saya|gw|aku|rekening|rek|norek)\b/i,
        /\b(ketemuan|cod)\s*(tapi|cuma|syaratnya)?\s*(bayar|transfer|tf)\s*(dulu|awal|separuh|dp)\b/i,
        /\b(bayar|transfer|tf|trf)\s*(langsung)\s*(aja|saja)\b/i,
        
        // Minta/Kasih Nomor secara eksplisit
        /\b(minta|bagi|kasih|kirim|tulis)\s*(no|nomor|nomer|wa|rek|rekening)\b/i,
        /\b(ini|nih|ni|nomor|no)\s*(wa|whatsapp|w a|watsap|rek|rekening|norek)\s*(saya|gw|aku)?\b/i,
        
        // Penyebutan Sosial Media / Chat Eksternal
        /\b(pindah|lanjut|lewat|chat|hubungi)\s*(aja\s*)?(ke|di|via)?\s*(wa|whatsapp|w a|ig|instagram|tele|telegram|line)\b/i,
        
        // Ejaan WA yang sering dipakai
        /\b(wa|whatsapp|w a|w\.a|watsap|wea|w4|w 4)\b/i,

        // Nama Platform E-Commerce Lain
        /\b(shopee|tokopedia|tokped|lazada|bukalapak|tiktok|carousell)\b/i
    ];

    if (!isFraud && fraudPhrases.some(pattern => pattern.test(t))) {
        isFraud = true;
    }

    // =========================================================================
    // 4. HASIL EVALUASI
    // =========================================================================
    if (isFraud) {
        return res.status(403).json({
            success: false,
            message: "⚠️ PESAN DIBLOKIR: Sistem mendeteksi adanya indikasi transaksi di luar sistem (Nomor WA, Rekening Pribadi, atau ajakan transfer langsung). Demi keamanan, semua transaksi WAJIB menggunakan sistem Pembayaran Escrow atau COD Resmi Campus Thrift Hub."
        });
    }

    next();
};

module.exports = antiFraudFilter;