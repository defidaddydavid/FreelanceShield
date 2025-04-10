// CommonJS version of the waitlist API handler for local testing
// This file uses CommonJS syntax for compatibility with Node.js

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables for Zoho Mail configuration
const ZOHO_USER = process.env.ZOHO_USER || 'get@freelanceshield.xyz';
const ZOHO_PASS = process.env.ZOHO_PASS;

// For EU-hosted domain-based emails with Zoho Mail
// Using settings from https://www.zoho.com/nl/mail/help/zoho-smtp.html
const ZOHO_HOST = process.env.ZOHO_HOST || 'smtp.zoho.com'; // Using standard Zoho SMTP server
const ZOHO_PORT = process.env.ZOHO_PORT ? parseInt(process.env.ZOHO_PORT) : 465; // Use 465 for SSL
const ZOHO_USE_SSL = process.env.ZOHO_USE_SSL !== 'false'; // Default to SSL

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://ymsimbeqrvupvmujzrrd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client lazily to avoid initialization errors
let supabase = null;
let adminSupabase = null;

function initSupabase() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  return supabase;
}

function initAdminSupabase() {
  if (!adminSupabase) {
    adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
      ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        })
      : initSupabase();
  }
  return adminSupabase;
}

// Google Form URL for more detailed information
const WAITLIST_FORM_URL = "https://forms.gle/qZjpDon9kGKqDBJr5";

// Email HTML template with retro-futuristic design matching FreelanceShield's branding
function getEmailTemplate(email) {
  return `
    <div style="font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a18; color: #ffffff; border-radius: 8px; border: 1px solid #9945FF;">
      <h1 style="font-family: 'NT Brick Sans', Arial, sans-serif; color: #9945FF; font-size: 28px; margin-bottom: 20px; letter-spacing: 0.5px; text-transform: uppercase;">Welcome to FreelanceShield!</h1>
      
      <p style="margin-bottom: 15px; line-height: 1.5;">Thank you for joining our waitlist. We're building the future of freelance protection on Solana, and we're excited to have you on board!</p>
      
      <div style="background: linear-gradient(rgba(153, 69, 255, 0.1), rgba(0, 255, 255, 0.1)); padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 3px solid #00FFFF;">
        <p style="margin: 0; color: #00FFFF; font-weight: bold;">To help us tailor FreelanceShield to your needs, please complete our brief survey:</p>
      </div>
      
      <a href="${WAITLIST_FORM_URL}" style="display: inline-block; background: linear-gradient(to right, #9945FF, #14F195); color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 15px 0; text-transform: uppercase; letter-spacing: 1px;">Complete Our Survey</a>
      
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
  // Check if ZOHO_PASS is available
  if (!ZOHO_PASS) {
    console.error('ZOHO_PASS environment variable not set. Email sending is disabled.');
    return { success: false, error: 'Email credentials not configured' };
  }

  try {
    console.log(`Attempting to send email to ${to} via Zoho Mail`);
    console.log(`Using SMTP settings: ${ZOHO_HOST}:${ZOHO_PORT} (secure: ${ZOHO_PORT === 465})`);
    
    // Create a transporter with Zoho Mail settings
    const transporter = nodemailer.createTransport({
      host: ZOHO_HOST,
      port: ZOHO_PORT,
      secure: ZOHO_PORT === 465, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: ZOHO_USER,
        pass: ZOHO_PASS
      },
      tls: {
        // Required for some Zoho Mail configurations
        rejectUnauthorized: false
      },
      debug: true, // Enable debug output
      logger: true  // Log information about the mail
    });
    
    // Try to verify the connection first
    try {
      console.log('Verifying email configuration...');
      await transporter.verify();
      console.log('Email configuration verified successfully');
    } catch (verifyError) {
      console.error('Email verification error:', verifyError.message);
      
      // Try alternative configuration if the first one fails
      if (ZOHO_PORT === 587) {
        console.log('Trying alternative configuration with SSL on port 465...');
        transporter.options.port = 465;
        transporter.options.secure = true;
      } else {
        console.log('Trying alternative configuration with TLS on port 587...');
        transporter.options.port = 587;
        transporter.options.secure = false;
      }
      
      try {
        await transporter.verify();
        console.log('Alternative email configuration verified successfully');
      } catch (altError) {
        console.error('Alternative configuration also failed:', altError.message);
        // Continue anyway - we'll try to send the email
      }
    }
    
    // Send the email
    console.log('Sending email...');
    const info = await transporter.sendMail({
      from: `"FreelanceShield" <${ZOHO_USER}>`,
      to,
      subject,
      html,
      headers: {
        'X-Entity-Ref-ID': `freelanceshield-${new Date().getTime()}`, // Unique ID to prevent threading
        'List-Unsubscribe': '<mailto:unsubscribe@freelanceshield.xyz?subject=unsubscribe>'
      }
    });
    
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

// Log waitlist signup to database
async function logWaitlistSignup(email) {
  try {
    console.log(`Attempting to log email to waitlist: ${email}`);
    
    // Initialize Supabase client
    const adminClient = initAdminSupabase();
    
    // First check if email already exists
    console.log('Checking if email already exists...');
    const { data: existingData, error: existingError } = await adminClient
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .single();
    
    if (existingError && existingError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is expected if email doesn't exist
      console.error('Error checking for existing email:', existingError);
    }
    
    if (existingData) {
      console.log(`Email ${email} already exists in waitlist`);
      return { success: true, duplicate: true };
    }

    // Store the email in Supabase
    console.log('Inserting email into waitlist table...');
    
    const { data, error } = await adminClient
      .from('waitlist')
      .insert([
        { 
          email,
          created_at: new Date().toISOString(),
          source: 'website'
        }
      ])
      .select();

    if (error) {
      // Check if it's a duplicate email error (unique constraint violation)
      if (error.code === '23505') {
        console.log(`Email ${email} already exists in waitlist (constraint violation)`);
        return { success: true, duplicate: true };
      }
      
      console.error('Supabase insert error:', error);
      return { success: false, error };
    }

    console.log('Successfully inserted email into waitlist');
    return { success: true, data };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message || 'Unknown database error' };
  }
}

// Handler for API requests
async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    console.log('Received waitlist signup request');
    
    // Get email from request body
    const email = req.body && req.body.email;

    // Basic validation
    if (!email || !email.includes('@')) {
      console.log('Invalid email provided:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address' 
      });
    }

    console.log('Valid email received:', email);
    
    // Log to database first - we want to ensure the email is saved even if sending fails
    const dbResult = await logWaitlistSignup(email);
    
    if (!dbResult.success) {
      console.error('Database error:', dbResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to store email in database',
        error: dbResult.error
      });
    }

    // Don't send duplicate emails if already in waitlist
    if (dbResult.duplicate) {
      return res.status(200).json({ 
        success: true, 
        message: 'You are already on our waitlist! We\'ll be in touch soon.'
      });
    }

    // Try to send thank you email, but continue even if it fails
    let emailSent = false;
    let emailError = null;
    try {
      if (ZOHO_PASS) {
        const htmlContent = getEmailTemplate(email);
        const emailResult = await sendEmail(
          email,
          'Welcome to FreelanceShield Waitlist',
          htmlContent
        );
        
        emailSent = emailResult.success;
        emailError = emailResult.error;
        console.log(`Email sending result for ${email}:`, emailResult);
      } else {
        console.log('Email sending skipped: ZOHO_PASS not configured');
      }
    } catch (error) {
      console.error('Error sending email, but continuing:', error.message);
      emailError = error.message;
    }
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: emailSent 
        ? 'Thank you for joining our waitlist! Check your email for additional information.' 
        : 'Thank you for joining our waitlist! We\'ll be in touch soon with more information about FreelanceShield.',
      email_sent: emailSent,
      email_error: emailError,
      database_saved: true
    });
  } catch (error) {
    console.error('Error processing waitlist signup:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to add to waitlist. Please try again later.',
      error: error.message
    });
  }
}

// Export the handler function
module.exports = handler;
