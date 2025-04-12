// Serverless function for handling waitlist signup and email sending
// This will be deployed to Vercel alongside the frontend application

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Debug environment variables (safely)
console.log('Available environment variables:', {
  STORAGE_SUPABASE_URL: !!process.env.STORAGE_SUPABASE_URL,
  STORAGE_SUPABASE_SERVICE_ROLE_KEY: !!process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  ZOHO_HOST: !!process.env.ZOHO_HOST,
  ZOHO_PORT: !!process.env.ZOHO_PORT,
  ZOHO_USER: !!process.env.ZOHO_USER,
  ZOHO_PASS: !!process.env.ZOHO_PASS,
  NODE_ENV: process.env.NODE_ENV
});

// Supabase configuration - check both naming conventions
const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ymsimbeqrvupvmujzrrd.supabase.co';
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Email configuration for domain-based email address
const emailConfig = {
  host: process.env.ZOHO_SMTP_HOST || process.env.ZOHO_HOST || 'smtp.zoho.com',
  port: process.env.ZOHO_SMTP_PORT ? parseInt(process.env.ZOHO_SMTP_PORT) : (process.env.ZOHO_PORT ? parseInt(process.env.ZOHO_PORT) : 465),
  secure: true, // Use SSL/TLS
  auth: {
    user: process.env.ZOHO_EMAIL || process.env.ZOHO_USER || 'david@freelanceshield.xyz',
    pass: process.env.ZOHO_PASSWORD || process.env.ZOHO_PASS
  }
};

// Initialize Supabase client
let supabase = null;
function getSupabase() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey,
        url: supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'missing'
      });
      return null;
    }
    
    try {
      console.log('Initializing Supabase client with URL:', supabaseUrl.substring(0, 20) + '...');
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      return null;
    }
  }
  return supabase;
}

// Generate thank you email
function generateEmail(email) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to FreelanceShield Waitlist</title>
  <style>
    body { font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 30px; background-color: rgb(10, 10, 24); color: rgb(255, 255, 255); border-radius: 12px; border: 2px solid rgb(153, 69, 255) }
    h1 { font-family: Arial, sans-serif; color: rgb(153, 69, 255); font-size: 36px; margin-bottom: 24px; letter-spacing: 1px; text-transform: uppercase; }
    p { font-size: 18px; margin: 20px 0; line-height: 1.6; }
    .callout { padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid rgb(0, 191, 255); }
    .callout p { font-size: 18px; margin: 0; color: rgb(0, 191, 255); }
    .button { display: inline-block; background: linear-gradient(to right, rgb(153, 69, 255), rgb(0, 191, 255)); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; font-size: 18px; }
    .footer { margin-top: 36px; padding-top: 24px; border-top: 1px solid rgb(192, 192, 192); }
    .footer p { font-size: 16px; color: rgb(210, 210, 210); }
    .unsubscribe { font-size: 12px; color: rgb(150, 150, 150); margin-top: 20px; }
    .unsubscribe a { color: rgb(150, 150, 150); text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Welcome to FreelanceShield!</h1>
  <p>Thank you for joining our waitlist. We're building the future of freelance protection on Solana, and we're excited to have you on board!</p>
  <div class="callout">
    <p><b>To help us tailor FreelanceShield to your needs, please complete our brief survey:</b></p>
  </div>
  <a href="https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform" class="button">Complete Our Survey</a>
  <p>The survey will help us understand your specific needs as a freelancer and how we can better protect your work and income.</p>
  <p>We'll keep you updated on our progress and you'll be among the first to know when we launch!</p>
  <div class="footer">
    <p>The FreelanceShield Team</p>
  </div>
  <p class="unsubscribe">
    <a href="mailto:unsubscribe@freelanceshield.xyz?subject=Unsubscribe ${email}">Unsubscribe</a>
  </p>
</body>
</html>
  `;
}

// Main API handler function
module.exports = async (req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // For GET requests, return environment status (useful for debugging)
  if (req.method === 'GET') {
    try {
      // Test SMTP connection
      const transporter = nodemailer.createTransport(emailConfig);
      let smtpVerification = { success: false, error: null };
      
      try {
        await transporter.verify();
        smtpVerification.success = true;
      } catch (error) {
        smtpVerification.error = error.message;
      }
      
      return res.status(200).json({
        success: true,
        message: 'Waitlist API is operational',
        env: {
          STORAGE_SUPABASE_URL: !!process.env.STORAGE_SUPABASE_URL,
          STORAGE_SUPABASE_SERVICE_ROLE_KEY: !!process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY,
          ZOHO_EMAIL: !!process.env.ZOHO_EMAIL,
          ZOHO_PASSWORD: !!process.env.ZOHO_PASSWORD,
          ZOHO_SMTP_HOST: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
          ZOHO_SMTP_PORT: process.env.ZOHO_SMTP_PORT || '465'
        },
        smtpVerification
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking API status',
        error: error.message
      });
    }
  }
  
  // Only process POST requests for actual waitlist signups
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed',
      fallbackUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform'
    });
  }
  
  try {
    // Get the email from the request body
    let email;
    
    try {
      // Check if the body is already parsed
      if (typeof req.body === 'object' && req.body !== null) {
        email = req.body.email;
      } else if (typeof req.body === 'string') {
        // Try to parse the body as JSON
        const parsedBody = JSON.parse(req.body);
        email = parsedBody.email;
      }
      
      // Log for debugging
      console.log('Request body:', typeof req.body, req.body);
      console.log('Extracted email:', email);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request format. Please provide a valid email address.',
        fallbackUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform'
      });
    }
    
    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address',
        fallbackUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform'
      });
    }
    
    // Initialize Supabase client
    const supabase = getSupabase();
    if (!supabase) {
      console.error('Supabase client initialization failed');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error. Please try the Google Form instead.',
        fallbackUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform'
      });
    }
    
    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (existingEmail) {
      return res.status(200).json({ 
        success: true, 
        message: "You're already on our waitlist! We'll notify you when we launch.", 
        alreadyExists: true 
      });
    }
    
    // Get user agent and IP for analytics
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      (req.connection ? req.connection.remoteAddress : 'Unknown');
    
    // Add to waitlist
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert([{ 
        email, 
        user_agent: userAgent,
        ip_address: ipAddress
      }]);
      
    if (insertError) {
      console.error('Error adding to waitlist:', insertError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error saving your email. Please try the Google Form instead.',
        fallbackUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform'
      });
    }
    
    // Try to send email, but don't fail if it doesn't work
    let emailSent = false;
    try {
      // Plain text version for better deliverability
      const textVersion = `
Welcome to FreelanceShield!

Thank you for joining our waitlist. We're building the future of freelance protection on Solana, and we're excited to have you on board!

To help us tailor FreelanceShield to your needs, please complete our brief survey:
https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform

The survey will help us understand your specific needs as a freelancer and how we can better protect your work and income.

We'll keep you updated on our progress and you'll be among the first to know when we launch!

The FreelanceShield Team
      `;
      
      // Create transporter
      const transporter = nodemailer.createTransport(emailConfig);
      
      // Send email
      const info = await transporter.sendMail({
        from: {
          name: 'FreelanceShield Team',
          address: emailConfig.auth.user
        },
        to: email,
        subject: 'Welcome to the FreelanceShield Waitlist!',
        text: textVersion,
        html: generateEmail(email),
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'High',
          'List-Unsubscribe': `<mailto:unsubscribe@freelanceshield.xyz?subject=Unsubscribe ${email}>`
        }
      });
      
      console.log('Email sent successfully:', info.messageId);
      emailSent = true;
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // We don't fail the request if email sending fails
    }
    
    // Return success
    return res.status(200).json({
      success: true,
      message: emailSent 
        ? 'Successfully joined the waitlist! Check your email for confirmation.' 
        : 'Successfully joined the waitlist! You\'ll be notified when we launch.',
      emailSent,
      fallbackUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform'
    });
    
  } catch (error) {
    console.error('Error in waitlist API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try the Google Form instead.',
      fallbackUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform'
    });
  }
};
