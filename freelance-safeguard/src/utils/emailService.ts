/**
 * Email Service for FreelanceShield
 * Handles email sending for waitlist signups with environment detection
 */

// Define the response type for email operations
export interface EmailResponse {
  success: boolean;
  message: string;
  emailSent?: boolean;
  adminNotified?: boolean;
}

// Base URL for API endpoints - detects environment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://freelanceshield.xyz' 
  : 'http://localhost:3000';

/**
 * Adds an email to the waitlist and sends confirmation emails
 * @param email The email address to add to the waitlist
 * @returns Promise with the operation result
 */
export async function addToWaitlist(email: string): Promise<EmailResponse> {
  try {
    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, message: 'Please enter a valid email address' };
    }

    console.log('Calling waitlist API at:', `${API_BASE_URL}/api/waitlist`);
    
    // Call the Vercel API endpoint
    const response = await fetch(`${API_BASE_URL}/api/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Check if the response is OK
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      return { 
        success: false, 
        message: `API error: ${response.status} ${response.statusText}`,
        emailSent: false,
        adminNotified: false
      };
    }

    // Parse the response
    const data = await response.json();
    console.log('API response:', data);
    
    // Return the result
    return {
      success: data.success,
      message: data.message,
      emailSent: data.emailSent,
      adminNotified: data.adminNotified
    };
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return { 
      success: false, 
      message: 'Failed to join waitlist. Please try again or use the Google Form link.',
      emailSent: false,
      adminNotified: false
    };
  }
}

/**
 * Get the Google Form URL for waitlist fallback
 * @returns The Google Form URL for waitlist signup
 */
export function getWaitlistFormUrl(): string {
  return 'https://forms.gle/CMigcH8wUh84DEcq8';
}
