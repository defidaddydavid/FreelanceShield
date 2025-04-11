// Serverless function for handling waitlist signup and email sending
// This will be deployed to Vercel alongside the frontend application

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Initialize Supabase client with Vercel environment variables
const getAdminSupabase = () => {
  const supabaseUrl = process.env.STORAGE_SUPABASE_URL;
  const supabaseServiceKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Database configuration missing');
  }
  
  console.log('Initializing Supabase client with URL:', supabaseUrl.substring(0, 15) + '...');
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Check if an email already exists in the waitlist
const checkEmailExists = async (email) => {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking if email exists:', error);
      throw error;
    }
    
    return data !== null;
  } catch (error) {
    console.error('Exception checking if email exists:', error);
    return false; // Assume email doesn't exist if there's an error
  }
};

// Configure the email transporter using Zoho Mail
const getEmailTransporter = () => {
  const zohoUser = process.env.ZOHO_USER;
  const zohoPassword = process.env.ZOHO_PASSWORD || process.env.ZOHO_PASS; // Support both env var names
  const zohoHost = process.env.ZOHO_HOST || 'smtp.zoho.eu';
  const zohoPort = parseInt(process.env.ZOHO_PORT || '465', 10);
  const useSSL = process.env.ZOHO_USE_SSL !== 'false';
  
  console.log(`Configuring email with ${zohoHost}:${zohoPort}, SSL: ${useSSL}, User: ${zohoUser ? zohoUser.substring(0, 5) + '...' : 'missing'}`);
  
  return nodemailer.createTransport({
    host: zohoHost,
    port: zohoPort,
    secure: useSSL,
    auth: {
      user: zohoUser,
      pass: zohoPassword
    }
  });
};

// Generate a random confirmation token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Add a new email to the waitlist
const addToWaitlist = async (email, userAgent, ipAddress) => {
  try {
    const supabase = getAdminSupabase();
    const confirmationToken = generateToken();
    
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        { 
          email, 
          confirmation_token: confirmationToken,
          user_agent: userAgent,
          ip_address: ipAddress
        }
      ])
      .select();
    
    if (error) {
      console.error('Error adding to waitlist:', error);
      throw error;
    }
    
    console.log('Successfully added to waitlist:', data);
    return { success: true, confirmationToken };
  } catch (error) {
    console.error('Exception adding to waitlist:', error);
    throw error;
  }
};

// Generate thank you email HTML
const generateThankYouEmail = (email) => {
  return `
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #9945FF; margin-bottom: 5px;">Welcome to FreelanceShield!</h1>
        <p style="font-size: 16px; color: #666666;">Thank you for joining our waitlist</p>
      </div>
      
      <p style="margin-bottom: 15px; line-height: 1.5;">Hi there,</p>
      
      <p style="margin-bottom: 15px; line-height: 1.5;">Thank you for joining the FreelanceShield waitlist! We're building a decentralized insurance protocol to protect freelancers from non-payment and project disputes.</p>
      
      <div style="background: linear-gradient(rgba(153, 69, 255, 0.1), rgba(0, 255, 255, 0.1)); padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 3px solid #00FFFF;">
        <p style="margin: 0; color: #00FFFF; font-weight: bold;">To help us tailor FreelanceShield to your needs, please complete our brief survey:</p>
      </div>
      
      <a href="https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform?embedded=true" style="display: inline-block; background: linear-gradient(to right, #9945FF, #14F195); color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 15px 0; text-transform: uppercase; letter-spacing: 1px;">Complete Our Survey</a>
      
      <p style="margin-top: 20px; line-height: 1.5;">The survey will help us understand your specific needs as a freelancer and how we can better protect your work and income.</p>
      
      <p style="margin-top: 25px; line-height: 1.5;">We'll keep you updated on our progress and you'll be among the first to know when we launch!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(153, 69, 255, 0.3);">
        <p style="font-size: 14px; color: #aaaaaa;">The FreelanceShield Team</p>
        <p style="font-size: 12px; color: #888888;">Powered by Solana</p>
      </div>
    </div>
  `;
};

// Send confirmation email
const sendConfirmationEmail = async (email, token) => {
  try {
    const transporter = getEmailTransporter();
    const emailHtml = generateThankYouEmail(email);
    
    console.log(`Sending confirmation email to ${email}`);
    
    const mailOptions = {
      from: process.env.ZOHO_USER || 'get@freelanceshield.xyz',
      to: email,
      subject: 'Welcome to the FreelanceShield Waitlist!',
      html: emailHtml
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
};

// Main API handler function
export default async function handler(req, res) {
  console.log('Received request:', req.method, 'from origin:', req.headers.origin);
  
  // Set CORS headers for all responses - must be set before any early returns
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight OPTIONS request - must come right after setting CORS headers
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request with CORS headers set');
    res.status(200).end();
    return;
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Get the email from the request body
    const { email } = req.body;
    
    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }
    
    // Check if the email already exists
    const exists = await checkEmailExists(email);
    if (exists) {
      return res.status(200).json({ 
        success: true, 
        message: "You're already on our waitlist! We'll notify you when we launch.", 
        alreadyExists: true 
      });
    }
    
    // Get user agent and IP for analytics
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = 
      req.headers['x-forwarded-for'] || 
      req.headers['x-real-ip'] || 
      req.connection?.remoteAddress || 
      'Unknown';
    
    // Add to waitlist
    const { confirmationToken } = await addToWaitlist(email, userAgent, ipAddress);
    
    // Send confirmation email (but don't fail if it doesn't work)
    const emailSent = await sendConfirmationEmail(email, confirmationToken);
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: emailSent 
        ? 'Successfully joined the waitlist! Check your email for confirmation.' 
        : 'Successfully joined the waitlist! You\'ll be notified when we launch.',
      emailSent 
    });
    
  } catch (error) {
    console.error('Error in waitlist API:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
}
