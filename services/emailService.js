const config = require('../config/config');

const emailService = {
  sendOtpEmail: async (to, otp) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to,
        subject: 'Verify your email - Drive Clone',
        text: `Your verification code is ${otp}. It expires in ${config.otpExpirationMinutes} minutes.`,
        html: `<p>Your verification code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in ${config.otpExpirationMinutes} minutes.</p>`
      })
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to send OTP email: ${res.status} ${body}`);
    }
  }
};

module.exports = emailService;
