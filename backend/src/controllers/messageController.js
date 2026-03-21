const Message = require('../models/Message');

// @desc    Kirim Pesan Baru (Filter Anti-Bypass Super Ketat)
// @route   POST /api/messages
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, productId, text } = req.body;
        const senderId = req.user.id;

        if (!text) return res.status(400).json({ message: 'Pesan tidak boleh kosong' });

        // 🛡️ ANTI-WA 2.0 SUPER KETAT
        // 1. Nangkap deretan angka 10-15 digit meskipun diakali pakai spasi, titik, atau strip
        const phoneRegex = /([\d][\s\-\.]*){10,16}/g;
        // 2. Nangkap variasi kata WA (wa, w a, whatsapp, watsap, dll)
        const waRegex = /\b(wa|w a|whatsapp|watsap|we a)\b/gi;
        
        let filteredText = text;
        
        // Eksekusi Sensor
        if (phoneRegex.test(filteredText) || waRegex.test(filteredText)) {
            filteredText = filteredText.replace(phoneRegex, ' 🚫[NOMOR HP DISENSOR]🚫 ');
            filteredText = filteredText.replace(waRegex, '🚫[KATA DISENSOR]🚫');
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            productId,
            text: filteredText
        });

        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Ambil Riwayat Chat dengan User Tertentu
// @route   GET /api/messages/chat/:receiverId
exports.getMessages = async (req, res) => {
    try {
        const myId = req.user.id;
        const targetId = req.params.receiverId;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: targetId },
                { senderId: targetId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 }); 

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Ambil Daftar Semua Obrolan (Inbox / Kotak Masuk)
// @route   GET /api/messages/conversations
exports.getConversations = async (req, res) => {
    try {
        const myId = req.user.id;

        // Cari semua pesan di mana saya terlibat
        const messages = await Message.find({
            $or: [{ senderId: myId }, { receiverId: myId }]
        }).populate('senderId receiverId', 'name profilePicture isVerified');

        // Kelompokkan pesan berdasarkan lawan bicara
        const conversations = new Map();

        messages.forEach(msg => {
            // Tentukan siapa lawan bicara kita di pesan ini
            const otherUser = msg.senderId._id.toString() === myId.toString() ? msg.receiverId : msg.senderId;
            const otherUserId = otherUser._id.toString();

            // Masukkan pesan terbaru ke Map
            if (!conversations.has(otherUserId)) {
                conversations.set(otherUserId, {
                    user: otherUser,
                    lastMessage: msg.text,
                    updatedAt: msg.createdAt
                });
            } else {
                const existing = conversations.get(otherUserId);
                if (new Date(msg.createdAt) > new Date(existing.updatedAt)) {
                    conversations.set(otherUserId, {
                        user: otherUser,
                        lastMessage: msg.text,
                        updatedAt: msg.createdAt
                    });
                }
            }
        });

        // Ubah Map menjadi Array dan urutkan dari yang paling baru
        const chatList = Array.from(conversations.values()).sort((a, b) => b.updatedAt - a.updatedAt);

        res.status(200).json({ success: true, data: chatList });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};