const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');

// In-memory cache ringan untuk melacak siapa yang sedang mengetik
const typingCache = new Map(); 

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, message, productId, text } = req.body;
        const senderId = req.user.id;

        const content = text || message;

        if (!receiverId || !content) {
            return res.status(400).json({ message: 'Penerima dan isi pesan wajib diisi' });
        }

        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: 'Format ID Penerima tidak valid' });
        }

        const messageData = {
            senderId,
            receiverId,
            text: content.trim(), 
            isRead: false
        };

        if (productId && mongoose.Types.ObjectId.isValid(productId)) {
            messageData.productId = productId;
        }

        const newMessage = await Message.create(messageData);

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('senderId', 'name profilePicture isVerified campus')
            .populate('productId', 'title imageUrl price');

        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');

        if (io && userSockets) {
            const receiverSocketId = userSockets.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive_message', populatedMessage);
            }
        }

        const receiver = await User.findById(receiverId);
        
        if (receiver) {
            const lastMessage = await Message.findOne({
                senderId: senderId,
                receiverId: receiverId,
                _id: { $ne: newMessage._id }
            }).sort({ createdAt: -1 });

            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            let shouldSendNotification = true;
            if (lastMessage && lastMessage.createdAt > fiveMinutesAgo) {
                shouldSendNotification = false; 
            }

            if (shouldSendNotification) {
                const shortContent = content.length > 40 ? content.substring(0, 40) + '...' : content;
                await Notification.create({
                    userId: receiverId,
                    title: `Pesan Baru dari ${populatedMessage.senderId.name} 💬`,
                    message: `"${shortContent}"`,
                    type: 'SYSTEM'
                });

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
                        </div>
                    `;

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

exports.getMessages = async (req, res) => {
    try {
        const { receiverId } = req.params; 
        const myId = req.user.id;

        await Message.updateMany(
            { senderId: receiverId, receiverId: myId, isRead: false },
            { $set: { isRead: true } }
        );

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: receiverId },
                { senderId: receiverId, receiverId: myId }
            ]
        })
        .populate('productId', 'title price images imageUrl')
        .sort({ createdAt: 1 });

        let isTyping = false;
        const typingData = typingCache.get(receiverId.toString());
        if (typingData && typingData.targetId === myId.toString() && typingData.expiresAt > Date.now()) {
            isTyping = true;
        }

        res.status(200).json({ success: true, data: messages, isTyping });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.setTypingStatus = (req, res) => {
    const { receiverId, isTyping } = req.body;
    const myId = req.user.id.toString();

    if (isTyping) {
        typingCache.set(myId, { targetId: receiverId.toString(), expiresAt: Date.now() + 3000 });
    } else {
        typingCache.delete(myId);
    }
    
    res.status(200).json({ success: true });
};

// @desc    Ambil Daftar Semua Obrolan (Inbox) & Kelompokkan berdasarkan Role
exports.getConversations = async (req, res) => {
    try {
        const myId = req.user.id;
        
        // Ambil pesan urut dari yang paling lama untuk melacak produk dan firstSender
        const messages = await Message.find({
            $or: [{ senderId: myId }, { receiverId: myId }]
        })
        .populate('senderId receiverId', 'name profilePicture isVerified isBanned')
        .populate({
            path: 'productId',
            select: 'title images imageUrl sellerId seller user price' // Mengambil kemungkinan field kepemilikan
        })
        .sort({ createdAt: 1 }); 

        const conversations = new Map();

        messages.forEach(msg => {
            const isMeSender = msg.senderId._id.toString() === myId.toString();
            const otherUser = isMeSender ? msg.receiverId : msg.senderId;
            const otherUserId = otherUser._id.toString();

            const isUnreadForMe = (msg.receiverId._id.toString() === myId.toString() && msg.isRead === false);

            if (!conversations.has(otherUserId)) {
                conversations.set(otherUserId, {
                    user: otherUser,
                    lastMessage: msg.text,
                    isRead: !isUnreadForMe, 
                    senderId: msg.senderId._id,
                    updatedAt: msg.createdAt,
                    product: msg.productId || null,
                    firstSenderId: msg.senderId._id.toString()
                });
            } else {
                const existing = conversations.get(otherUserId);
                // Selalu perbarui dengan pesan terbaru
                if (new Date(msg.createdAt) > new Date(existing.updatedAt)) {
                    existing.lastMessage = msg.text;
                    existing.senderId = msg.senderId._id;
                    existing.updatedAt = msg.createdAt;
                }
                // Jika ada 1 saja pesan unread buat saya, tandai false
                if (isUnreadForMe) {
                    existing.isRead = false;
                }
                // Update produk jika pesan membawa info produk
                if (msg.productId) {
                    existing.product = msg.productId;
                }
            }
        });

       const chatList = Array.from(conversations.values()).map(conv => {
            let role = 'buyer'; // Default kita sebagai pembeli

            if (conv.product) {
                // Cek siapa pemilik produk (menyesuaikan skema db kamu: sellerId, seller, atau user)
                const ownerId = conv.product.sellerId || conv.product.seller || conv.product.user;
                if (ownerId && ownerId.toString() === myId.toString()) {
                    role = 'seller'; // Kita yang jual barangnya
                }
            } else {
                // Kalau gak ada produk, tebak dari siapa yang dichat duluan
                if (conv.firstSenderId !== myId.toString()) {
                    role = 'seller'; 
                }
            }

            return { ...conv, role };
       }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.status(200).json({ success: true, data: chatList });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};