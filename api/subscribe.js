const { Pool } = require('pg');
const nodemailer = require('nodemailer');

// 1. Database Configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Required for Aiven/Cloud DBs
  }
});

// 2. Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // This must be an App Password, not login password
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    // 3. Save to Database
    const insertQuery = 'INSERT INTO subscribers (email) VALUES ($1) RETURNING *';
    await pool.query(insertQuery, [email]);

    // 4. Send Confirmation Email
    const mailOptions = {
      from: '"Naruto x AxtCity" <its.narutouzumaki.here@gmail.com>',
      to: email,
      subject: 'Welcome to the Void - Subscription Confirmed',
      html: `
        <div style="background:#000; color:#fff; padding:40px; font-family: sans-serif; text-align:center;">
            <img src="https://naruto.axtcity.online/pfp" style="width:100px; border-radius:50%; border:2px solid #ff0000; margin-bottom:20px;">
            <h2 style="text-transform:uppercase; letter-spacing:2px;">Subscription Confirmed</h2>
            <p style="color:#ccc;">You have successfully joined the Naruto x AxtCity mailing list.</p>
            <p>We will keep you updated on the latest deployments.</p>
            <br>
            <a href="https://naruto.axtcity.online" style="color:#ff0000; text-decoration:none;">Return to Website</a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Subscribed successfully' });

  } catch (error) {
    console.error('Subscription Error:', error);
    
    // Handle duplicate email error (Postgres error code 23505)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'You are already subscribed.' });
    }

    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
