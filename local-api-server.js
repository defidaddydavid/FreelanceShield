// Local API server for FreelanceShield waitlist
// This provides a local implementation of the waitlist API endpoint
require('./test-env'); // Load environment variables

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Email configuration
const ZOHO_USER = process.env.ZOHO_USER || 'david@freelanceshield.xyz';
const ZOHO_PASS = process.env.ZOHO_PASS;
const ZOHO_HOST = process.env.ZOHO_HOST || 'smtp.zoho.eu';
const ZOHO_PORT = process.env.ZOHO_PORT ? parseInt(process.env.ZOHO_PORT) : 465;
const ZOHO_USE_SSL = process.env.ZOHO_USE_SSL !== 'false';

// Email HTML template
function getEmailTemplate(email) {
  return `
    <div style="font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a18; color: #ffffff; border-radius: 8px; border: 1px solid #9945FF;">
      <h1 style="font-family: 'NT Brick Sans', Arial, sans-serif; color: #9945FF; font-size: 28px; margin-bottom: 20px; letter-spacing: 0.5px; text-transform: uppercase;">Welcome to FreelanceShield!</h1>
      
      <p style="margin-bottom: 15px; line-height: 1.5;">Thank you for joining our waitlist. We're building the future of freelance protection on Solana, and we're excited to have you on board!</p>
      
      <div style="background: linear-gradient(rgba(153, 69, 255, 0.1), rgba(0, 255, 255, 0.1)); padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 3px solid #00FFFF;">
        <p style="margin: 0; color: #00FFFF; font-weight: bold;">To help us tailor FreelanceShield to your needs, please complete our brief survey:</p>
      </div>
      
      <a href="https://forms.gle/qZjpDon9kGKqDBJr5" style="display: inline-block; background: linear-gradient(to right, #9945FF, #14F195); color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 15px 0; text-transform: uppercase; letter-spacing: 1px;">Complete Our Survey</a>
      
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
  if (!ZOHO_PASS) {
    console.log('ZOHO_PASS not configured, skipping email sending');
    return { success: false, error: 'Email credentials not configured' };
  }

  try {
    console.log(`Attempting to send email to ${to} via Zoho Mail`);
    console.log(`Using SMTP settings: ${ZOHO_HOST}:${ZOHO_PORT} (SSL: ${ZOHO_USE_SSL})`);
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: ZOHO_HOST,
      port: ZOHO_PORT,
      secure: ZOHO_USE_SSL,
      auth: {
        user: ZOHO_USER,
        pass: ZOHO_PASS
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      debug: true,
      logger: true
    });
    
    // Verify configuration
    try {
      await transporter.verify();
      console.log('Email configuration verified successfully');
    } catch (verifyError) {
      console.error('Email verification error:', verifyError.message);
      
      if (verifyError.code === 'ESOCKET' || verifyError.code === 'ECONNECTION') {
        // Try alternative settings
        console.log('Trying alternative settings (TLS on port 587)...');
        transporter.options.port = 587;
        transporter.options.secure = false;
        
        try {
          await transporter.verify();
          console.log('Alternative email configuration verified successfully');
        } catch (altError) {
          console.error('Alternative configuration also failed:', altError.message);
          return { success: false, error: 'Email server connection failed' };
        }
      } else {
        return { success: false, error: verifyError.message };
      }
    }
    
    // Send email
    const info = await transporter.sendMail({
      from: `"FreelanceShield" <${ZOHO_USER}>`,
      to,
      subject,
      html,
      headers: {
        'X-Entity-Ref-ID': `freelanceshield-${new Date().getTime()}`,
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

// Add to waitlist function
async function addToWaitlist(email) {
  try {
    console.log(`Adding email to waitlist: ${email}`);
    
    // Check if email already exists
    const { data: existingData, error: existingError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .single();
    
    if (existingData) {
      console.log(`Email ${email} already exists in waitlist`);
      return { success: true, duplicate: true };
    }
    
    // Insert email into Supabase
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        { 
          email,
          created_at: new Date().toISOString(),
          source: 'website-local'
        }
      ])
      .select();
    
    if (error) {
      // Check for duplicate email (unique constraint violation)
      if (error.code === '23505') {
        return { success: true, duplicate: true };
      }
      
      console.error('Supabase insert error:', error);
      return { success: false, error };
    }
    
    console.log('Successfully inserted email into waitlist');
    return { success: true, data };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }
}

// API Routes
app.post('/api/waitlist-signup', async (req, res) => {
  try {
    console.log('Received waitlist signup request');
    console.log('Request body:', req.body);
    
    const { email } = req.body;
    
    // Basic validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address' 
      });
    }
    
    // Add to waitlist
    const dbResult = await addToWaitlist(email);
    
    if (!dbResult.success) {
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
    
    // Try to send thank you email
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
      } else {
        console.log('Email sending skipped: ZOHO_PASS not configured');
      }
    } catch (error) {
      console.error('Error sending email:', error.message);
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
});

// Start server
app.listen(PORT, () => {
  console.log(`Local API server running at http://localhost:${PORT}`);
  console.log(`Waitlist API endpoint: http://localhost:${PORT}/api/waitlist-signup`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Supabase key configured: ${!!SUPABASE_SERVICE_ROLE_KEY}`);
  console.log(`Zoho Mail configured: ${!!ZOHO_PASS}`);
});
