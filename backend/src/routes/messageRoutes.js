const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getConversations, setTypingStatus } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, sendMessage);

// FITUR BARU: Rute Typing
router.post('/typing', protect, setTypingStatus);

// Rute Inbox (Daftar Chat)
router.get('/conversations', protect, getConversations); 

// Rute Detail Chat
router.get('/chat/:receiverId', protect, getMessages); 

module.exports = router;