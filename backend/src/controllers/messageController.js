const Message = require('../models/Message');

// In-memory cache ringan untuk melacak siapa yang sedang mengetik
// (Tidak perlu disimpan di database karena status ini hanya sementara)
const typingCache = new Map(); 

// @desc    Kirim Pesan Baru
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, productId, text } = req.body;
        const senderId = req.user.id;

        if (!text) return res.status(400).json({ message: 'Pesan tidak boleh kosong' });

        const t = text.toLowerCase();
        const phoneRegex = /(?:\+\s*62|62|0)[\s\-.]*8[0-9]{1,2}[\s\-.]?[0-9]{3,4}[\s\-.]?[0-9]{3,4}/g;
        const forbiddenPatterns = [
            /\b(pindah|lanjut|lewat|chat|hubungi)\s*(aja\s*)?(ke|di|via)?\s*(wa|whatsapp|w a|ig|instagram|tele|telegram|line)\b/i,
            /\b(ini|ni|nih|nomor|no)\s*(wa|whatsapp|w a|watsap)\b/i,
            /\b(wa|whatsapp|w a|w\.a|watsap|wea)\b/i,
            /\b(rek|rekening|norek|bca|bni|bri|mandiri|bsi|cimb|danamon|permata|mega|bjb|gopay|gpay|dana|ovo|shopeepay|spay|linkaja)\b.{0,30}?\d{5,}/i,
            /\b(transfer|tf)\s+(langsung|sekarang|aja|ke|rek|rekening|bank)\b/i,
            /\b(minta|bagi|kirim)\s+(rek|rekening|norek)\b/i,
            /\b(via|tf|transfer|pake|pakai|ke|bayar|topup|top\s?up)\s+(dana|ovo|gopay|gpay|shopeepay|spay|linkaja)\b/i,
            /\b(shopee|tokopedia|lazada|bukalapak|tiktok)\b/i
        ];

        const isFraud = phoneRegex.test(t) || forbiddenPatterns.some(pattern => pattern.test(t));

        if (isFraud) {
            return res.status(403).json({
                success: false,
                message: "Teks diblokir! Dilarang menyertakan nomor WA atau Rekening."
            });
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            productId: productId || null,
            text: text
        });

        // Hapus status typing saat pesan terkirim
        typingCache.delete(senderId.toString());

        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Ambil Riwayat Chat dengan User Tertentu
exports.getMessages = async (req, res) => {
    try {
        const { receiverId } = req.params; 
        const myId = req.user.id;

        // ========================================================
        // 1. UPDATE ISREAD: Tandai semua pesan yang dikirim oleh 
        //    lawan bicara kepadaku menjadi "SUDAH DIBACA"
        // ========================================================
        await Message.updateMany(
            { senderId: receiverId, receiverId: myId, isRead: false },
            { $set: { isRead: true } }
        );

        // 2. Ambil riwayat percakapan
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: receiverId },
                { senderId: receiverId, receiverId: myId }
            ]
        })
        .populate('productId', 'title price images imageUrl')
        .sort({ createdAt: 1 });

        // 3. Cek apakah lawan bicara sedang mengetik untukku
        let isTyping = false;
        const typingData = typingCache.get(receiverId.toString());
        // Jika data typing ada, tujuannya untukku, dan belum expired (di bawah 3 detik)
        if (typingData && typingData.targetId === myId.toString() && typingData.expiresAt > Date.now()) {
            isTyping = true;
        }

        // Kirimkan data pesan beserta status mengetik lawan
        res.status(200).json({ success: true, data: messages, isTyping });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Set Status Sedang Mengetik
// @route   POST /api/messages/typing
exports.setTypingStatus = (req, res) => {
    const { receiverId, isTyping } = req.body;
    const myId = req.user.id.toString();

    if (isTyping) {
        // Set expired 3 detik dari sekarang (kalau user berhenti ngetik otomatis hilang)
        typingCache.set(myId, { targetId: receiverId.toString(), expiresAt: Date.now() + 3000 });
    } else {
        typingCache.delete(myId);
    }
    
    res.status(200).json({ success: true });
};

// @desc    Ambil Daftar Semua Obrolan (Inbox)
exports.getConversations = async (req, res) => {
    try {
        const myId = req.user.id;
        const messages = await Message.find({
            $or: [{ senderId: myId }, { receiverId: myId }]
        }).populate('senderId receiverId', 'name profilePicture isVerified');

        const conversations = new Map();

        messages.forEach(msg => {
            const otherUser = msg.senderId._id.toString() === myId.toString() ? msg.receiverId : msg.senderId;
            const otherUserId = otherUser._id.toString();

            if (!conversations.has(otherUserId)) {
                conversations.set(otherUserId, {
                    user: otherUser,
                    lastMessage: msg.text,
                    isRead: msg.isRead,
                    senderId: msg.senderId._id,
                    updatedAt: msg.createdAt
                });
            } else {
                const existing = conversations.get(otherUserId);
                if (new Date(msg.createdAt) > new Date(existing.updatedAt)) {
                    conversations.set(otherUserId, {
                        user: otherUser,
                        lastMessage: msg.text,
                        isRead: msg.isRead,
                        senderId: msg.senderId._id,
                        updatedAt: msg.createdAt
                    });
                }
            }
        });

        const chatList = Array.from(conversations.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        res.status(200).json({ success: true, data: chatList });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};