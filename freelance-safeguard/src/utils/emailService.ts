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
  ? '' // Use relative URL in production to avoid CORS issues
  : 'http://localhost:3000';

/**
 * Tests the Supabase database connection
 * @returns Promise with the test result
 */
export async function testSupabaseConnection(): Promise<EmailResponse> {
  try {
    const apiUrl = `${API_BASE_URL}/api/v1/supabase-test`;
    console.log('Testing Supabase connection at:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Supabase test response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('Supabase test response not OK:', response.status, response.statusText);
      return { 
        success: false, 
        message: `Supabase connection failed: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    console.log('Supabase test response data:', data);
    
    return {
      success: data.success,
      message: `Supabase test: ${data.message}${data.recordCount !== undefined ? ` (${data.recordCount} records found)` : ''}`
    };
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return { 
      success: false, 
      message: `Supabase test error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Tests the API connection with a simple endpoint
 * @returns Promise with the test result
 */
export async function testApiConnection(): Promise<EmailResponse> {
  try {
    const apiUrl = `${API_BASE_URL}/api/v1/test`;
    console.log('Testing API connection at:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Test API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('Test API response not OK:', response.status, response.statusText);
      return { 
        success: false, 
        message: `API test failed: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    console.log('Test API response data:', data);
    
    return {
      success: true,
      message: `API test successful: ${data.message}`
    };
  } catch (error) {
    console.error('Error testing API connection:', error);
    return { 
      success: false, 
      message: `API test error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

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

    const apiUrl = `${API_BASE_URL}/api/v1/waitlist-signup`;
    console.log('Calling waitlist API at:', apiUrl);
    
    // Call the Vercel API endpoint
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Log the raw response for debugging
    console.log('API response status:', response.status, response.statusText);
    
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
    console.log('API response data:', data);
    
    // Return the result
    return {
      success: data.success,
      message: data.message,
      emailSent: data.emailSent,
      adminNotified: false // waitlist-signup doesn't send admin notifications
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
