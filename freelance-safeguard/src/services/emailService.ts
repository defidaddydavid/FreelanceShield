/**
 * Email Service for FreelanceShield
 * Handles sending thank you emails and waitlist confirmations via serverless function
 */

import { WAITLIST_FORM_URL } from '@/api/waitlist';

// API endpoint for the serverless function - use environment variable if available
const API_ENDPOINT = import.meta.env.VITE_WAITLIST_API_ENDPOINT || 
  (import.meta.env.PROD 
    ? 'https://freelanceshield.xyz/api/waitlist-signup' 
    : '/api/waitlist-signup');

// Email configuration from environment variables
const EMAIL_CONFIG = {
  apiKey: import.meta.env.VITE_EMAIL_API_KEY || '',
  sender: import.meta.env.VITE_EMAIL_SENDER || 'get@freelanceshield.xyz',
  service: import.meta.env.VITE_EMAIL_SERVICE || 'zoho',
  sendRealEmailsInDev: import.meta.env.VITE_DEV_SEND_REAL_EMAILS === 'true'
};

// Company email address
const COMPANY_EMAIL = EMAIL_CONFIG.sender;

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Sends an email via the serverless function
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if we should actually send emails in dev mode
    if (!import.meta.env.PROD && !EMAIL_CONFIG.sendRealEmailsInDev) {
      // For development, log the email details
      console.log('📧 DEV MODE - Email would be sent via ' + EMAIL_CONFIG.service);
      console.log(`From: ${options.from || COMPANY_EMAIL}`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Content: ${options.html || options.text}`);
      return true;
    }
    
    // Verify we have API key in production
    if (import.meta.env.PROD && !EMAIL_CONFIG.apiKey) {
      console.error('Missing email API key in production environment');
      return false;
    }
    
    // Call the API endpoint
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': EMAIL_CONFIG.apiKey
      },
      body: JSON.stringify({
        email: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        from: options.from || COMPANY_EMAIL,
        service: EMAIL_CONFIG.service
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Email API error (${response.status}): ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Sends a thank you email with the Google Form link to the waitlist subscriber
 */
export async function sendWaitlistConfirmation(email: string): Promise<boolean> {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #9945FF, #00FFFF); padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">FreelanceShield</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
          <h2>Welcome to FreelanceShield!</h2>
          <p>Thank you for joining our waitlist. We're building a Solana-powered insurance protocol to protect freelancers and clients.</p>
          <p>Please complete your profile by filling out this short form:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${WAITLIST_FORM_URL}" style="background: #9945FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Your Profile</a>
          </div>
          <p>We'll keep you updated on our progress and notify you as soon as we launch.</p>
          <p>Best regards,<br>The FreelanceShield Team</p>
        </div>
      </div>
    `;w
    
    // Use regular sendEmail function with HTML content
    return await sendEmail({
      to: email,
      subject: "Welcome to FreelanceShield's Waitlist!",
      html: htmlContent,
      text: `Welcome to FreelanceShield! Thank you for joining our waitlist. Please complete your profile by visiting: ${WAITLIST_FORM_URL}. We'll keep you updated on our progress and notify you when we launch. Best regards, The FreelanceShield Team`
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}
