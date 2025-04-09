// Serverless function for handling waitlist signup and email sending
// This will be deployed to Vercel alongside the frontend application

const nodemailer = require('nodemailer');

// Load environment variables for Zoho Mail configuration
const ZOHO_USER = process.env.ZOHO_USER || 'get@freelanceshield.xyz';
const ZOHO_SMTP_HOST = 'smtp.zoho.eu'; // European Zoho Mail server
const ZOHO_SMTP_PORT = 465; // Using SSL port
const ZOHO_PASSWORD = process.env.ZOHO_PASSWORD;
const ZOHO_USE_SSL = true; // Using SSL (port 465)

// Google Form URL for more detailed information
const WAITLIST_FORM_URL = "https://forms.gle/qZjpDon9kGKqDBJr5";

// In-memory store (for development only)
// In production, this would use a database like Supabase, MongoDB, etc.
const subscribers = new Map();

// Email HTML template
function getEmailTemplate(email) {
  return `
    <div style="font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a18; color: #ffffff; border-radius: 8px; border: 1px solid #9945FF;">
      <h1 style="font-family: 'NT Brick Sans', Arial, sans-serif; color: #9945FF; font-size: 24px; margin-bottom: 20px; letter-spacing: 0.5px;">Welcome to FreelanceShield!</h1>
      
      <p style="margin-bottom: 15px; line-height: 1.5;">Thank you for joining our waitlist. We're building the future of freelance protection on Solana, and we're excited to have you on board!</p>
      
      <div style="background: linear-gradient(rgba(153, 69, 255, 0.1), rgba(0, 255, 255, 0.1)); padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 3px solid #00FFFF;">
        <p style="margin: 0; color: #00FFFF;">To help us tailor FreelanceShield to your needs, please complete our brief survey:</p>
      </div>
      
      <a href="${WAITLIST_FORM_URL}" style="display: inline-block; background: linear-gradient(to right, #9945FF, #14F195); color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 15px 0;">Complete Our Survey</a>
      
      <p style="margin-top: 20px; line-height: 1.5;">The survey will help us understand your specific needs as a freelancer and how we can better protect your work and income.</p>
      
      <p style="margin-top: 25px; line-height: 1.5;">We'll keep you updated on our progress and you'll be among the first to know when we launch!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(153, 69, 255, 0.3);">
        <p style="font-size: 14px; color: #aaaaaa;">The FreelanceShield Team</p>
        <p style="font-size: 12px; color: #888888;">Powered by Solana</p>
      </div>
    </div>
  `;
}

// Send email function
async function sendEmail(to, subject, html) {
  // Check if ZOHO_PASSWORD is available
  if (!ZOHO_PASSWORD) {
    console.warn('ZOHO_PASSWORD environment variable not set. Email sending is disabled.');
    return false;
  }

  try {
    // Create a transporter with Zoho Mail Europe settings
    const transporter = nodemailer.createTransport({
      host: ZOHO_SMTP_HOST,
      port: ZOHO_SMTP_PORT,
      secure: ZOHO_USE_SSL, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: ZOHO_USER,
        pass: ZOHO_PASSWORD
      }
    });

    // Send the email
    const info = await transporter.sendMail({
      from: `"FreelanceShield Team" <${ZOHO_USER}>`,
      to,
      subject,
      html
    });

    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Handler for API requests
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Get email from request body
    const { email } = req.body;

    // Basic validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address' 
      });
    }

    // Check if email already exists
    if (subscribers.has(email)) {
      return res.status(200).json({ 
        success: true, 
        message: 'Email already registered' 
      });
    }

    // Store the email (in a real implementation, this would be in a database)
    subscribers.set(email, {
      email,
      timestamp: new Date()
    });

    // Send thank you email with Google Form link
    const htmlContent = getEmailTemplate(email);
    const emailSent = await sendEmail(
      email,
      'Welcome to FreelanceShield Waitlist',
      htmlContent
    );

    console.log(`Added to waitlist: ${email} - Email sent: ${emailSent}`);
    
    return res.status(200).json({ 
      success: true, 
      message: emailSent 
        ? 'Thank you for joining our waitlist! Check your email for additional information.' 
        : 'Successfully added to waitlist, but there was an issue sending the confirmation email.'
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to add to waitlist. Please try again later.' 
    });
  }
};
