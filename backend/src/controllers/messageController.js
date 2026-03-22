const Message = require('../models/Message');
const Notification = require('../models/Notification'); // 🔔 IMPORT NOTIFIKASI
const User = require('../models/User'); // Untuk mengambil nama pengirim
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail'); // 📧 IMPORT SEND EMAIL

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
            text: content.trim(), 
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

        // =========================================================================
        // 🌟 7. LOGIKA NOTIFIKASI & EMAIL (DENGAN ANTI-SPAM COOLDOWN 5 MENIT) 🌟
        // =========================================================================
        const receiver = await User.findById(receiverId);
        
        if (receiver) {
            // Cek kapan terakhir kali pengirim ini mengirim pesan ke penerima ini
            const lastMessage = await Message.findOne({
                senderId: senderId,
                receiverId: receiverId,
                _id: { $ne: newMessage._id } // Selain pesan yang baru saja dibuat
            }).sort({ createdAt: -1 });

            // Batas waktu cooldown (5 Menit)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            // Kirim notifikasi HANYA JIKA ini pesan pertama, ATAU pesan sebelumnya dikirim > 5 menit yang lalu
            let shouldSendNotification = true;
            if (lastMessage && lastMessage.createdAt > fiveMinutesAgo) {
                shouldSendNotification = false; 
            }

            if (shouldSendNotification) {
                // A. Buat Notifikasi In-App (Di Tab Notifikasi)
                const shortContent = content.length > 40 ? content.substring(0, 40) + '...' : content;
                await Notification.create({
                    userId: receiverId,
                    title: `Pesan Baru dari ${populatedMessage.senderId.name} 💬`,
                    message: `"${shortContent}"`,
                    type: 'SYSTEM' // <--- PERBAIKAN: Menggunakan enum valid 'SYSTEM' bukan 'INFO'
                });

                // B. Kirim Notifikasi ke Email
                if (receiver.email) {
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const emailHtml = `
                        <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; max-w: 600px; margin: 0 auto;">
                            <h2 style="color: #00478F; margin-top: 0;">Pesan Baru di Campus Thrift Hub</h2>
                            <p style="color: #334155; font-size: 16px;">Halo <strong>${receiver.name}</strong>,</p>
                            <p style="color: #334155; font-size: 16px;">Anda baru saja mendapat pesan dari <strong>${populatedMessage.senderId.name}</strong>:</p>
                            
                            <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #FF9500; margin: 24px 0; border-radius: 0 12px 12px 0; font-style: italic; color: #475569; font-size: 16px;">
                                "${content}"
                            </div>
                            
                            <p style="color: #334155; font-size: 14px; margin-bottom: 24px;">Silakan login ke aplikasi untuk membalas pesan ini agar transaksi berjalan lancar.</p>
                            
                            <a href="${frontendUrl}/chat/${senderId}" style="display: inline-block; background-color: #00478F; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px;">Balas Pesan Sekarang</a>
                            
                            <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Email ini dikirim secara otomatis oleh sistem Campus Thrift Hub.</p>
                        </div>
                    `;

                    // Kirim secara asynchronous agar tidak memblokir respon ke pengirim
                    sendEmail({
                        email: receiver.email,
                        subject: `Pesan Baru dari ${populatedMessage.senderId.name} - Campus Thrift Hub`,
                        message: emailHtml
                    }).catch(err => console.error("Gagal mengirim email notifikasi chat:", err));
                }
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
        }).populate('senderId receiverId', 'name profilePicture isVerified isBanned'); 

        const conversations = new Map();

        messages.forEach(msg => {
            // Tentukan siapa lawan bicara di percakapan ini
            const isMeSender = msg.senderId._id.toString() === myId.toString();
            const otherUser = isMeSender ? msg.receiverId : msg.senderId;
            const otherUserId = otherUser._id.toString();

            // Pesan hanya dianggap "belum dibaca" JIKA penerimanya adalah SAYA, dan status pesannya false.
            const isUnreadForMe = (msg.receiverId._id.toString() === myId.toString() && msg.isRead === false);
            const isReadStatusForMe = !isUnreadForMe;

            if (!conversations.has(otherUserId)) {
                conversations.set(otherUserId, {
                    user: otherUser,
                    lastMessage: msg.text,
                    isRead: isReadStatusForMe, 
                    senderId: msg.senderId._id,
                    updatedAt: msg.createdAt
                });
            } else {
                const existing = conversations.get(otherUserId);
                // Hanya timpa jika pesan ini lebih baru dari yang sudah tersimpan di map
                if (new Date(msg.createdAt) > new Date(existing.updatedAt)) {
                    conversations.set(otherUserId, {
                        user: otherUser,
                        lastMessage: msg.text,
                        isRead: isReadStatusForMe, 
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