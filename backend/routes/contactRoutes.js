// routes/contactRoutes.js
const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'outlook', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Contact form endpoint
router.post('/', async (req, res) => {
    try {
        const { fullName, email, cellPhone, message } = req.body;

        if (!fullName || !email || !cellPhone || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "raavish@probillrcm.com",
            cc: ["raavishdahuja@rowthtech.com", "mukeshbhandari@rowthtech.com"],
            subject: `New Contact Form Submission from ${fullName}`,
            html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${cellPhone}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><em>This email was sent from your RCM landing page contact form.</em></p>
      `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);

        res.status(200).json({
            success: true,
            message: 'Email sent successfully!',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email. Please try again later.',
            error: error.message
        });
    }
});

module.exports = router;
