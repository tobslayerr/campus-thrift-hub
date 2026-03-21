const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Buat transporter menggunakan SMTP Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Sandi Aplikasi 16 digit
        },
    });

    // 2. Tentukan opsi email
    const mailOptions = {
        from: 'Campus Thrift Hub <noreply@campusthrift.com>',
        to: options.email,
        subject: options.subject,
        html: options.message, // Menggunakan HTML agar tampilan email lebih rapi
    };

    // 3. Kirim email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;