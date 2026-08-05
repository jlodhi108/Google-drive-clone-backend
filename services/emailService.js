const nodemailer = require('nodemailer');
const config = require('../config/config');

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: Number(config.smtpPort) === 465,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass
  }
});

const emailService = {
  sendOtpEmail: async (to, otp) => {
    await transporter.sendMail({
      from: config.fromEmail,
      to,
      subject: 'Verify your email - Drive Clone',
      text: `Your verification code is ${otp}. It expires in ${config.otpExpirationMinutes} minutes.`,
      html: `<p>Your verification code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in ${config.otpExpirationMinutes} minutes.</p>`
    });
  }
};

module.exports = emailService;
