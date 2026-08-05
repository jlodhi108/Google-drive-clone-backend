const config = require('../config/config');

const emailService = {
  sendOtpEmail: async (to, otp) => {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.fromEmail },
        subject: 'Verify your email - Drive Clone',
        content: [
          { type: 'text/plain', value: `Your verification code is ${otp}. It expires in ${config.otpExpirationMinutes} minutes.` },
          { type: 'text/html', value: `<p>Your verification code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in ${config.otpExpirationMinutes} minutes.</p>` }
        ]
      })
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to send OTP email: ${res.status} ${body}`);
    }
  }
};

module.exports = emailService;
