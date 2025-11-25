const nodemailer = require('nodemailer');

// Reuse existing transporter config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // its.narutouzumaki.here@gmail.com
    pass: process.env.EMAIL_PASS  // Your App Password
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // 1. EMAIL TO ADMIN (You)
    const adminMailOptions = {
      from: `"AXT City Bot" <${process.env.EMAIL_USER}>`,
      to: 'arunmohan.6017@gmail.com', // Admin Email
      replyTo: email, // Lets you simply hit reply to email the user back
      subject: `New Contact: ${name}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    // 2. EMAIL TO USER (Confirmation)
    const userMailOptions = {
      from: `"Naruto x AxtCity" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'We received your message',
      html: `
        <div style="background:#000; color:#fff; padding:30px; font-family: sans-serif; border: 1px solid #333;">
            <img src="https://naruto.axtcity.online/pfp" style="width:60px; border-radius:50%; border:2px solid #ff0000; margin-bottom:20px;">
            <h2 style="text-transform:uppercase; color: #ff0000;">Message Received</h2>
            <p>Hello ${name},</p>
            <p>Your signal has reached the void. We will review your message and get back to you if necessary.</p>
            <br>
            <p style="color:#666; font-size: 12px;">Copy of your message:<br><em>${message}</em></p>
            <hr style="border-color: #333;">
            <a href="https://naruto.axtcity.online" style="color:#fff; text-decoration:none; font-size:12px;">Naruto x AxtCity</a>
        </div>
      `
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    return res.status(200).json({ message: 'Sent successfully' });

  } catch (error) {
    console.error('Contact Form Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
