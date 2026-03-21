require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const userRoutes = require('./src/routes/userRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

// Inisialisasi Express
const app = express();

// Middleware dasar
app.use(cors());
app.use(express.json()); // Agar bisa membaca body format JSON
app.use(express.urlencoded({ extended: true })); // Agar bisa membaca format Form Data (untuk upload file)

// Connect ke MongoDB
connectDB();

// Mounting Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);

// Route Default / Home
app.get('/', (req, res) => {
    res.send('API Campus Thrift Hub Berjalan Lancar! 🚀');
});

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di mode ${process.env.NODE_ENV} pada port ${PORT}`);
});