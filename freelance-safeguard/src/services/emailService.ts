/**
 * Email Service for FreelanceShield
 * Handles sending thank you emails and waitlist confirmations via serverless function
 */

import { WAITLIST_FORM_URL } from '@/api/waitlist';

// API endpoint for the serverless function
const API_ENDPOINT = process.env.NODE_ENV === 'production' 
  ? 'https://freelanceshield.xyz/api/waitlist-signup' 
  : '/api/waitlist-signup';

// Company email address
const COMPANY_EMAIL = 'get@freelanceshield.xyz';

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
    if (process.env.NODE_ENV !== 'production') {
      // For development, log the email details
      console.log('📧 DEV MODE - Email would be sent via Zoho Mail');
      console.log(`From: ${options.from || COMPANY_EMAIL}`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Content: ${options.html || options.text}`);
      return true;
    }
    
    // Call the API endpoint
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      }),
    });
    
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
  // In production, the email HTML will be generated on the server
  // For development, we'll just call the API endpoint with the email address
  
  try {
    if (process.env.NODE_ENV !== 'production') {
      // For development, just return success
      console.log(`📧 DEV MODE - Would send welcome email from ${COMPANY_EMAIL} to ${email}`);
      return true;
    }
    
    // Call the API endpoint directly with just the email
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}
