// Serverless function for handling waitlist signup and email sending
// This will be deployed to Vercel alongside the frontend application

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Load environment variables for Zoho Mail configuration
const ZOHO_USER = process.env.ZOHO_USER || 'david@freelanceshield.xyz';
const ZOHO_PASS = process.env.ZOHO_PASS || '';
const ZOHO_HOST = 'smtp.zoho.com';
const ZOHO_USE_SSL = true; // Using SSL (port 465)

// Supabase configuration
// Using the Transaction pooler connection for serverless functions
const supabaseUrl = process.env.SUPABASE_URL || 'https://ymsimbeqrvupvmujzrrd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Create a separate admin client with service role for operations that need it
const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : supabase;

// PostgreSQL direct connection (for database operations that need it)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.ymsimbeqrvupvmujzrrd:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

// Initialize PostgreSQL pool for direct database operations if needed
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Add debugging for environment variables
console.log('API environment check:');
console.log('- ZOHO_USER configured:', !!process.env.ZOHO_USER);
console.log('- ZOHO_PASS configured:', !!process.env.ZOHO_PASS);
console.log('- SUPABASE_URL configured:', !!process.env.SUPABASE_URL);
console.log('- SUPABASE_ANON_KEY configured:', !!process.env.SUPABASE_ANON_KEY);
console.log('- SUPABASE_SERVICE_ROLE_KEY configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('- DATABASE_URL configured:', !!process.env.DATABASE_URL);

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
    
    // Create a transporter with Zoho Mail settings
    const transporter = nodemailer.createTransport({
      host: ZOHO_HOST,
      port: 465,
      secure: ZOHO_USE_SSL, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: ZOHO_USER,
        pass: ZOHO_PASS
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      },
      debug: true, // Enable debug output
      logger: true  // Log information about the mail
    });
    
    // Verify transport configuration
    try {
      const verification = await transporter.verify();
      console.log('Transporter verification successful:', verification);
    } catch (verifyError) {
      console.error('Transporter verification failed:', verifyError);
      return { success: false, error: `SMTP verification failed: ${verifyError.message}` };
    }

    // Send the email
    const info = await transporter.sendMail({
      from: `"FreelanceShield" <${ZOHO_USER}>`,
      to,
      subject,
      html,
      headers: {
        'X-Priority': '1', // High priority
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });

    console.log('Email sent successfully: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command
    }, null, 2));
    return { success: false, error: error.message };
  }
}

// Log waitlist signup to database
async function logWaitlistSignup(email) {
  try {
    console.log(`Attempting to log email to waitlist: ${email}`);
    console.log(`Using Supabase URL: ${supabaseUrl}`);
    console.log(`Supabase key configured: ${!!supabaseKey}`);
    console.log(`Service role key configured: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
    
    // First check if email already exists
    console.log('Checking if email already exists...');
    const { data: existingData, error: existingError } = await adminSupabase
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .single();
    
    if (existingError) {
      console.log('Error response from existing email check:', JSON.stringify(existingError, null, 2));
      
      // Check if it's an RLS policy error
      if (existingError.code === 'PGRST301') {
        console.error('Row Level Security policy error. Make sure your RLS policies allow this operation.');
      }
    }
    
    if (existingData) {
      console.log(`Email ${email} already exists in waitlist`);
      return { success: true, duplicate: true };
    }
    
    if (existingError && existingError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is expected if email doesn't exist
      console.error('Error checking for existing email:', existingError);
    }

    // Store the email in Supabase
    console.log('Inserting email into waitlist table...');
    console.log('Using service role client:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data, error } = await adminSupabase
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
      
      // Check if it's an RLS policy error
      if (error.code === 'PGRST301') {
        console.error('Row Level Security policy error. Make sure your RLS policies allow this operation.');
      }
      
      console.error('Supabase insert error:', JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log('Successfully inserted email into waitlist:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error };
  }
}

// Handler for API requests
module.exports = async (req, res) => {
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
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Get email from request body
    const { email } = req.body;

    // Basic validation
    if (!email || !email.includes('@')) {
      console.log('Invalid email provided:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address' 
      });
    }

    console.log('Valid email received, proceeding with database insertion');
    
    // Log to database
    const dbResult = await logWaitlistSignup(email);
    
    console.log('Database result:', JSON.stringify(dbResult, null, 2));
    
    if (!dbResult.success && dbResult.error) {
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

    // Send thank you email with Google Form link
    const htmlContent = getEmailTemplate(email);
    const emailResult = await sendEmail(
      email,
      'Welcome to FreelanceShield Waitlist',
      htmlContent
    );

    console.log(`Added to waitlist: ${email} - Email sent: ${emailResult.success}`);
    
    return res.status(200).json({ 
      success: true, 
      message: emailResult.success 
        ? 'Thank you for joining our waitlist! Check your email for additional information.' 
        : 'Successfully added to waitlist, but there was an issue sending the confirmation email. Please check your spam folder.'
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to add to waitlist. Please try again later.',
      error: error.message
    });
  }
};
