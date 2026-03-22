const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); // Tambahkan http
const { Server } = require('socket.io'); // Tambahkan socket.io
const connectDB = require('./src/config/db');

dotenv.config();
connectDB();

const app = express();

// 🌟 PERBAIKAN CORS UNTUK PRODUCTION 🌟
// Pastikan url frontend Anda nanti didaftarkan di environment variable FRONTEND_URL
const allowedOrigins = [
    'http://localhost:5173', 
    process.env.FRONTEND_URL 
];

app.use(cors({
    origin: function (origin, callback) {
        // Izinkan request tanpa origin (seperti mobile apps atau curl) ATAU origin yang terdaftar
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup HTTP Server & Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    // 🌟 PERBAIKAN: Tambahkan polling agar Socket.io bisa berjalan di lingkungan yang membatasi WebSocket murni
    transports: ['websocket', 'polling'] 
});

// Jadikan io dan users Map bisa diakses dari controller
const userSockets = new Map(); // Menyimpan { userId: socketId }
app.set('io', io);
app.set('userSockets', userSockets);

io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);

    // Menerima event saat user login/membuka aplikasi
    socket.on('register_user', (userId) => {
        if (userId) {
            userSockets.set(userId, socket.id);
            console.log(`User ${userId} registered with socket ${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Hapus dari map saat disconnect
        for (let [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
    });
});

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "API Campus Thrift Hub berjalan dengan baik di Vercel Serverless!"
    });
});

// Rute
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/transactions', require('./src/routes/transactionRoutes'));
app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/payment-methods', require('./src/routes/paymentMethodRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

const PORT = process.env.PORT || 5000;

// Ganti app.listen menjadi server.listen
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});