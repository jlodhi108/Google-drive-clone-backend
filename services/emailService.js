const config = require('../config/config');

async function sendEmail({ to, subject, text, html }) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.sendgridApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: config.fromEmail },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html }
      ]
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to send email: ${res.status} ${body}`);
  }
}

const emailService = {
  sendOtpEmail: (to, otp) => sendEmail({
    to,
    subject: 'Verify your email - Drive Clone',
    text: `Your verification code is ${otp}. It expires in ${config.otpExpirationMinutes} minutes.`,
    html: `<p>Your verification code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in ${config.otpExpirationMinutes} minutes.</p>`
  }),

  sendPasswordResetEmail: (to, otp) => sendEmail({
    to,
    subject: 'Reset your password - Drive Clone',
    text: `Your password reset code is ${otp}. It expires in ${config.otpExpirationMinutes} minutes.`,
    html: `<p>Your password reset code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in ${config.otpExpirationMinutes} minutes. If you didn't request this, you can ignore this email.</p>`
  })
};

module.exports = emailService;
