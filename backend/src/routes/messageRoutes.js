const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getConversations } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, sendMessage);

// Rute Inbox (Daftar Chat) WAJIB DI ATAS
router.get('/conversations', protect, getConversations); 

// Rute Detail Chat
// Kita tambahkan /chat/ di depannya agar tidak bentrok dengan /conversations
router.get('/chat/:receiverId', protect, getMessages); 

module.exports = router;