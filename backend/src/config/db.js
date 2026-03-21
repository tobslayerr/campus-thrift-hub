const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI); // Kosongkan opsinya
        console.log(`✅ MongoDB Terhubung: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;