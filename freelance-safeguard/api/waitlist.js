// Simple Vercel API handler for waitlist signups
// This version is optimized for Vercel serverless functions

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Debug environment variables (safely)
console.log('Available environment variables:', {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
  ZOHO_HOST: !!process.env.ZOHO_HOST,
  ZOHO_PORT: !!process.env.ZOHO_PORT,
  ZOHO_USER: !!process.env.ZOHO_USER,
  ZOHO_PASS: !!process.env.ZOHO_PASS,
  NODE_ENV: process.env.NODE_ENV
});

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://ymsimbeqrvupvmujzrrd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Email configuration for domain-based email address
const emailConfig = {
  host: process.env.ZOHO_HOST || 'smtppro.zoho.eu',
  port: process.env.ZOHO_PORT ? parseInt(process.env.ZOHO_PORT) : 587,
  secure: process.env.ZOHO_PORT === '465' ? true : false,
  auth: {
    user: process.env.ZOHO_USER || 'david@freelanceshield.xyz',
    pass: process.env.ZOHO_PASS
  },
  tls: {
    // Required for Zoho Mail
    rejectUnauthorized: false
  }
};

// Initialize Supabase client
let supabase = null;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(to right, #5e35b1, #2979ff); padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #bdbdbd; }
        .button { display: inline-block; background: linear-gradient(to right, #5e35b1, #2979ff); color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to FreelanceShield!</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>Thank you for joining the FreelanceShield waitlist! We're excited to have you on board as we build the future of freelancer protection on Solana.</p>
        <p>Your email <strong>${email}</strong> has been added to our waitlist. We'll keep you updated on our progress and let you know when we're ready to launch.</p>
        <p>In the meantime, we'd love to learn more about your freelancing experience. Please consider filling out our brief survey:</p>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform" target="_blank" rel="noopener noreferrer" class="button">Complete Survey</a>
        <p>If you have any questions or feedback, feel free to reply to this email.</p>
        <p>Best regards,<br>The FreelanceShield Team</p>
      </div>
      <div class="footer">
        <p> 2025 FreelanceShield. All rights reserved. </p>
      </div>
    </body>
    </html>
  `;
}

// Main API handler function
module.exports = async (req, res) => {
  // Log environment variables (without sensitive values)
  console.log('Environment Variables Status:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasZohoHost: !!process.env.ZOHO_HOST,
    hasZohoPort: !!process.env.ZOHO_PORT,
    hasZohoUser: !!process.env.ZOHO_USER,
    hasZohoPass: !!process.env.ZOHO_PASS
  });

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    console.log('Received waitlist signup request');
    
    // Get email from request body
    const { email } = req.body;
    
    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }
    
    console.log('Processing valid email:', email);
    
    // Initialize Supabase
    const supabase = getSupabase();
    if (!supabase) {
      console.error('Failed to initialize Supabase client');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }
    
    // Check if email already exists
    const { data: existingEmail, error: checkError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing email:', checkError);
      return res.status(500).json({ success: false, message: 'Database error', error: checkError.message });
    }
    
    let isNewEmail = !existingEmail;
    
    // Save email to database if it's new
    if (isNewEmail) {
      // Create a simpler object that matches the exact schema
      const waitlistEntry = { 
        email: email,
        // Use created_at instead of signup_date (Supabase typically uses created_at by default)
        // Supabase will automatically set this if we don't include it
        source: 'landing_page'
      };
      
      console.log('Saving to database:', waitlistEntry);
      
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert([waitlistEntry]);
      
      if (insertError) {
        console.error('Error saving to database:', insertError);
        return res.status(500).json({ success: false, message: 'Failed to save to database', error: insertError.message });
      }
      
      console.log('Email saved to database successfully');
    } else {
      console.log('Email already exists in database');
    }
    
    // Send confirmation email
    try {
      if (!emailConfig.auth.pass) {
        console.warn('Email password not set, skipping email sending');
      } else {
        console.log('Attempting to send email with the following configuration:');
        console.log(`Host: ${emailConfig.host}`);
        console.log(`Port: ${emailConfig.port}`);
        console.log(`Secure: ${emailConfig.secure}`);
        console.log(`Auth User: ${emailConfig.auth.user}`);
        console.log(`Auth Pass: ${emailConfig.auth.pass ? '[PROVIDED]' : '[NOT PROVIDED]'}`);
        
        // Create transporter with zoho domain configuration
        const transporter = nodemailer.createTransport({
          host: emailConfig.host,
          port: emailConfig.port,
          secure: emailConfig.secure,
          auth: emailConfig.auth,
          // Set debug mode on to get detailed logs
          debug: true,
          // Use different TLS settings based on port
          ...(emailConfig.port === 587 ? {
            // TLS settings for port 587
            tls: {
              ciphers: 'SSLv3',
              rejectUnauthorized: false
            }
          } : {
            // SSL settings for port 465
            secure: true
          })
        });
        
        // Create email data
        const mailOptions = {
          from: `"FreelanceShield" <${emailConfig.auth.user}>`,
          to: email,
          subject: 'Welcome to FreelanceShield Waitlist!',
          html: generateEmail(email),
        };
        
        console.log('Sending email with the following options:', {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject
        });
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        
        if (info.messageId) {
          console.log('Email delivery successful with message ID:', info.messageId);
        }
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      console.error('Error details:', {
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode,
        stack: emailError.stack
      });
      // Continue with success response even if email fails
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: isNewEmail 
        ? 'Thank you for joining our waitlist! Check your email for additional information.' 
        : 'You are already on our waitlist! We\'ve sent you another confirmation email.',
      alreadyRegistered: !isNewEmail
    });
    
  } catch (error) {
    console.error('Unhandled error in waitlist API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An unexpected error occurred',
      error: error.message
    });
  }
};
