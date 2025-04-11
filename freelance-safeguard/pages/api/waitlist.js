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
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A56E2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
    .footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; }
    .button { display: inline-block; background-color: #4A56E2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to FreelanceShield!</h1>
  </div>
  <div class="content">
    <p>Hello ${email},</p>
    <p>Thank you for joining the FreelanceShield waitlist! We're excited to have you on board.</p>
    <p>FreelanceShield is building the future of freelancer protection - a decentralized insurance protocol that helps freelancers work with confidence.</p>
    <p>We'll notify you as soon as we launch our platform. In the meantime, feel free to follow us on social media for updates.</p>
    <p>Best regards,<br>The FreelanceShield Team</p>
  </div>
  <div class="footer">
    <p> 2025 FreelanceShield. All rights reserved.</p>
    <p>You're receiving this email because you signed up for the FreelanceShield waitlist.</p>
  </div>
</body>
</html>
  `;
}

// Main API handler function
module.exports = async (req, res) => {
  // Log environment variables (without sensitive values)
  console.log('Environment Variables Status:', {
    hasSupabaseUrl: !!process.env.STORAGE_SUPABASE_URL || !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || !!process.env.SUPABASE_SERVICE_ROLE_KEY,
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
      
      try {
        // Log the table we're trying to insert into
        console.log('Attempting to insert into table: waitlist');
        
        const { data, error: insertError } = await supabase
          .from('waitlist')
          .insert([waitlistEntry])
          .select();
        
        if (insertError) {
          console.error('Error saving to database:', insertError);
          console.error('Error details:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to save to database', 
            error: insertError.message,
            details: insertError.details || 'No additional details'
          });
        }
        
        console.log('Email saved to database successfully, data:', data);
      } catch (dbError) {
        console.error('Unexpected database error:', dbError);
        return res.status(500).json({ 
          success: false, 
          message: 'Unexpected database error', 
          error: dbError.message 
        });
      }
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
