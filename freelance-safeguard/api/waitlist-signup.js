// Serverless function for handling waitlist signup and email sending
// This will be deployed to Vercel alongside the frontend application

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Initialize Supabase client with Vercel environment variables
const getAdminSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
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

// Send confirmation email
const sendConfirmationEmail = async (email, token) => {
  try {
    const transporter = getEmailTransporter();
    const apiEndpoint = process.env.API_ENDPOINT || 'https://freelanceshield.xyz';
    
    const confirmationLink = `${apiEndpoint}/confirm?token=${token}&email=${encodeURIComponent(email)}`;
    
    console.log(`Sending confirmation email to ${email} with confirmation link: ${confirmationLink}`);
    
    const mailOptions = {
      from: process.env.ZOHO_USER || 'get@freelanceshield.xyz',
      to: email,
      subject: 'Confirm your FreelanceShield waitlist signup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to FreelanceShield!</h2>
          <p>Thank you for joining our waitlist. We're excited to have you on board!</p>
          <p>FreelanceShield is the first decentralized insurance protocol for freelancers on Solana, providing secure escrow, milestone payments, and dispute resolution.</p>
          <p>Please confirm your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Confirm Email</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 14px;">${confirmationLink}</p>
          <p>If you didn't sign up for FreelanceShield, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;">
          <p style="font-size: 12px; color: #666;"> 2025 FreelanceShield. All rights reserved.</p>
        </div>
      `
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
      req.connection.remoteAddress || 
      'Unknown';
    
    // Add to waitlist
    const { confirmationToken } = await addToWaitlist(email, userAgent, ipAddress);
    
    // Send confirmation email (but don't fail if it doesn't work)
    const emailSent = await sendConfirmationEmail(email, confirmationToken);
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: "You've been added to our waitlist! " + 
        (emailSent ? "Please check your email to confirm your signup." : "We'll notify you when we launch."),
      emailSent 
    });
    
  } catch (error) {
    console.error('Error in waitlist API:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
}
