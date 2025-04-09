// Simple in-memory waitlist storage
// In a production environment, you would use a database or external service
let waitlistEmails: string[] = [];
let subscribers: Map<string, { email: string, timestamp: Date }> = new Map();

// Google Form URL for more detailed information
export const WAITLIST_FORM_URL = "https://forms.gle/qZjpDon9kGKqDBJr5";

import { sendWaitlistConfirmation } from '@/services/emailService';

/**
 * Add an email to the waitlist and send a thank you email
 * @param email Email to add to the waitlist
 * @returns Success status and message
 */
export async function addToWaitlist(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Basic validation
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Invalid email address' };
    }

    // Check if email already exists
    if (subscribers.has(email)) {
      return { success: true, message: 'Email already registered' };
    }

    // Store the email (in a real implementation, this would be in a database)
    subscribers.set(email, {
      email,
      timestamp: new Date()
    });
    
    waitlistEmails.push(email);
    
    // Send thank you email with Google Form link
    const emailSent = await sendWaitlistConfirmation(email);
    
    // In a production environment, you would:
    // 1. Connect to a database or third-party service (e.g., Mailchimp, ConvertKit)
    // 2. Implement proper error handling and retries
    // 3. Add email validation and spam protection
    // 4. Set up email confirmation flow

    console.log(`Added to waitlist: ${email} - Email sent: ${emailSent}`);
    return { 
      success: true, 
      message: emailSent 
        ? 'Thank you for joining our waitlist! Check your email for additional information.' 
        : 'Successfully added to waitlist, but there was an issue sending the confirmation email.'
    };
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return { 
      success: false, 
      message: 'Failed to add to waitlist. Please try again later.' 
    };
  }
}

/**
 * Get all waitlist subscribers
 * @returns Array of waitlist subscribers
 */
export function getWaitlistSubscribers(): { email: string, timestamp: Date }[] {
  return Array.from(subscribers.values());
}

/**
 * Export waitlist as CSV
 * @returns CSV string of waitlist emails
 */
export function exportWaitlistCSV(): string {
  let csv = 'Email,Timestamp\n';
  
  subscribers.forEach((subscriber) => {
    csv += `${subscriber.email},${subscriber.timestamp.toISOString()}\n`;
  });
  
  return csv;
}
