// Simple Vercel API handler for waitlist signups
// This version is optimized for Vercel serverless functions

const nodemailer = require('nodemailer');

// Environment variables
const ZOHO_EMAIL = process.env.ZOHO_EMAIL || 'david@freelanceshield.xyz';
const ZOHO_PASSWORD = process.env.ZOHO_PASSWORD;
const ZOHO_SMTP_HOST = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com';
const ZOHO_SMTP_PORT = process.env.ZOHO_SMTP_PORT || 465;
const ZOHO_SMTP_SECURE = process.env.ZOHO_SMTP_SECURE === 'false' ? false : true;
const WAITLIST_EMAIL_SUBJECT = process.env.WAITLIST_EMAIL_SUBJECT || 'Welcome to FreelanceShield Waitlist!';
const WAITLIST_FROM_NAME = process.env.WAITLIST_FROM_NAME || 'FreelanceShield Team';

// In-memory storage for waitlist emails (for development/testing)
const waitlistEmails = [];

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: ZOHO_SMTP_HOST,
    port: ZOHO_SMTP_PORT,
    secure: ZOHO_SMTP_SECURE,
    auth: {
      user: ZOHO_EMAIL,
      pass: ZOHO_PASSWORD,
    },
  });
};

// Send welcome email to subscriber
const sendWelcomeEmail = async (email) => {
  try {
    if (!ZOHO_EMAIL || !ZOHO_PASSWORD) {
      console.error('Zoho email credentials not configured');
      return { success: false, message: 'Email service not configured properly' };
    }

    const transporter = createTransporter();
    
    // Using the original FreelanceShield email template
    const mailOptions = {
      from: `"${WAITLIST_FROM_NAME}" <${ZOHO_EMAIL}>`,
      to: email,
      subject: WAITLIST_EMAIL_SUBJECT,
      html: `
        <div>
            <div>
                <div>
                    <div style="font-family: &quot;Open Sans&quot;, &quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 30px; background-color: rgb(10, 10, 24); color: rgb(255, 255, 255); border-radius: 12px; border: 2px solid rgb(153, 69, 255)">
                        <h1 style="font-family: &quot;NT Brick Sans&quot;, Arial, sans-serif; color: rgb(153, 69, 255); font-size: 36px; margin-bottom: 24px; letter-spacing: 1px; text-transform: uppercase">
                            Welcome to FreelanceShield!
                            <br>
                        </h1>
                        <p style="margin-bottom: 20px; line-height: 1.6">
                            <span class="size" style="font-size: 18px; margin-bottom: 20px; line-height: 1.6;">
                                Thank you for joining our waitlist. We're building the future of freelance protection on Solana, and we're excited to have you on board!
                                <br>
                            </span>
                        </p>
                        <div style="padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid rgb(0, 191, 255)">
                            <p style="margin: 0px">
                                <span class="size" style="font-size: 18px; margin: 0px;">
                                    <span class="colour" style="color:rgb(0, 191, 255)">
                                        <b style="margin: 0px">
                                            To help us tailor FreelanceShield to your needs, please complete our brief survey:
                                        </b>
                                    </span>
                                    <br>
                                </span>
                            </p>
                        </div>
                        <a href="https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform?embedded=true" style="display: inline-block; background: linear-gradient(to right, rgb(153, 69, 255), rgb(0, 191, 255)); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; font-size: 18px" target="_blank">
                            Complete Our Survey
                        </a>
                        <p style="margin-top: 24px; line-height: 1.6">
                            <span class="size" style="font-size: 18px; margin-top: 24px; line-height: 1.6;">
                                The survey will help us understand your specific needs as a freelancer and how we can better protect your work and income.
                                <br>
                            </span>
                        </p>
                        <p style="margin-top: 28px; line-height: 1.6">
                            <span class="size" style="font-size: 18px; margin-top: 28px; line-height: 1.6;">
                                We'll keep you updated on our progress and you'll be among the first to know when we launch!
                                <br>
                            </span>
                        </p>
                        <div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid rgb(192, 192, 192)">
                            <p>
                                <span class="colour" style="color:rgb(210, 210, 210)">
                                    <span class="size" style="font-size:16px">
                                        The FreelanceShield Team
                                    </span>
                                </span>
                                <br>
                            </p>
                            <p>
                                <br>
                            </p>
                        </div>
                    </div>
                </div>
                <div>
                    <br>
                </div>
            </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Waitlist welcome email sent:', info.messageId);
    
    return { success: true, message: 'Welcome email sent successfully' };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, message: 'Failed to send welcome email' };
  }
};

// Send notification email to admin
const sendAdminNotification = async (subscriberEmail) => {
  try {
    if (!ZOHO_EMAIL || !ZOHO_PASSWORD) {
      console.error('Zoho email credentials not configured');
      return { success: false, message: 'Email service not configured properly' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${WAITLIST_FROM_NAME}" <${ZOHO_EMAIL}>`,
      to: ZOHO_EMAIL,
      subject: `New Waitlist Signup: ${subscriberEmail}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2>New Waitlist Signup</h2>
          <p>A new user has joined the FreelanceShield waitlist:</p>
          <p style="padding: 10px; background-color: #f5f5f5; border-left: 4px solid #9945FF;"><strong>Email:</strong> ${subscriberEmail}</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent:', info.messageId);
    
    return { success: true, message: 'Admin notification sent successfully' };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, message: 'Failed to send admin notification' };
  }
};

// API handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Store email in memory (for development/testing)
    if (!waitlistEmails.includes(email)) {
      waitlistEmails.push(email);
    }

    // Send welcome email to subscriber
    const welcomeEmailResult = await sendWelcomeEmail(email);
    
    // Send notification to admin
    const adminNotificationResult = await sendAdminNotification(email);

    // Return success even if emails fail - we've stored the email
    return res.status(200).json({ 
      success: true, 
      message: 'Added to waitlist successfully',
      emailSent: welcomeEmailResult.success,
      adminNotified: adminNotificationResult.success
    });
  } catch (error) {
    console.error('Waitlist API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
