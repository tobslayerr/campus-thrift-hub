const Message = require('../models/Message');
const Notification = require('../models/Notification'); // 🔔 IMPORT NOTIFIKASI
const User = require('../models/User'); // Untuk mengambil nama pengirim
const mongoose = require('mongoose');

// In-memory cache ringan untuk melacak siapa yang sedang mengetik
const typingCache = new Map(); 

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, message, productId, text } = req.body;
        const senderId = req.user.id;

        // Ambil isi pesan dari 'text' (prioritas) atau 'message' dari body
        const content = text || message;

        // 1. Validasi Input Dasar
        if (!receiverId || !content) {
            return res.status(400).json({ message: 'Penerima dan isi pesan wajib diisi' });
        }

        // 2. Validasi format ID
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: 'Format ID Penerima tidak valid' });
        }

        // 3. Siapkan data pesan sesuai Model (menggunakan field 'text')
        const messageData = {
            senderId,
            receiverId,
            text: content.trim(), // <--- DISESUAIKAN DENGAN MODEL (text)
            isRead: false
        };

        if (productId && mongoose.Types.ObjectId.isValid(productId)) {
            messageData.productId = productId;
        }

        // 4. Simpan ke Database
        const newMessage = await Message.create(messageData);

        // 5. Ambil data lengkap untuk Socket & Response
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('senderId', 'name profilePicture isVerified campus')
            .populate('productId', 'title imageUrl price');

        // 6. Logika Socket.io (Realtime)
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');

        if (io && userSockets) {
            const receiverSocketId = userSockets.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive_message', populatedMessage);
            }
        }

        res.status(201).json({ success: true, data: populatedMessage });

    } catch (error) {
        console.error("ERROR SEND_MESSAGE:", error); 
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan internal server saat mengirim pesan',
            error: error.message 
        });
    }
};

// @desc    Ambil Riwayat Chat dengan User Tertentu
exports.getMessages = async (req, res) => {
    try {
        const { receiverId } = req.params; 
        const myId = req.user.id;

        // 1. UPDATE ISREAD: Tandai semua pesan yang dikirim oleh 
        //    lawan bicara kepadaku menjadi "SUDAH DIBACA"
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
        }).populate('senderId receiverId', 'name profilePicture isVerified isBanned'); // 👈 TAMBAHKAN isBanned DI SINI

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