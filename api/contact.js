// This file replaces the use of nodemailer with the Resend API SDK.
// NOTE: Ensure you have installed the 'resend' package: npm install resend
// NOTE: Set your Resend API Key in your environment variables as process.env.RESEND_API_KEY.

import { Resend } from 'resend';

// Initialize Resend client using the API key from environment variables.
const resend = new Resend(process.env.RESEND_API_KEY);

// Define the custom email address to be used as the sender.
const SENDER_EMAIL = 'hello@mail.naruto.axtcity.online';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // Standard status code for method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // 1. EMAIL TO ADMIN (You)
    // Using the friendly name and custom email address
    const adminMailOptions = {
      from: `AXT City Bot <${SENDER_EMAIL}>`,
      to: 'arunmohan.6017@gmail.com', // Admin Email (Target remains the same)
      replyTo: email, // Allows you to reply directly to the user
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
    // Using the friendly name and custom email address
    const userMailOptions = {
      from: `Naruto x AxtCity <${SENDER_EMAIL}>`,
      to: email, // User's email
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

    // Send both emails simultaneously using Resend's send method
    await Promise.all([
      resend.emails.send(adminMailOptions),
      resend.emails.send(userMailOptions)
    ]);

    return res.status(200).json({ message: 'Sent successfully' });

  } catch (error) {
    console.error('Contact Form Error:', error);
    // In a production environment, you might log the specific error details.
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
