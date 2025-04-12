/**
 * Handles email sending for waitlist signups with environment detection
 */

// Define the response type for email operations
export interface EmailResponse {
  success: boolean;
  message: string;
  emailSent?: boolean;
  adminNotified?: boolean;
  envCheck?: any;
  fallbackUrl?: string;
  alreadyExists?: boolean;
}

// Base URL for API endpoints - detects environment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URL in production to avoid CORS issues
  : 'http://localhost:3000';

/**
 * Tests the root API endpoint
 * @returns Promise with the test result
 */
export async function testRootApi(): Promise<EmailResponse> {
  try {
    const apiUrl = `${API_BASE_URL}/api/waitlist`;
    console.log('Testing root API at:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Root API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('Root API response not OK:', response.status, response.statusText);
      return { 
        success: false, 
        message: `Root API test failed: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    console.log('Root API response data:', data);
    
    return {
      success: data.success,
      message: `API test: ${data.message}`,
      envCheck: data.env
    };
  } catch (error) {
    console.error('Error testing root API:', error);
    return { 
      success: false, 
      message: `API test error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Returns the Google Form URL for the waitlist
 * @returns The URL for the Google Form
 */
export function getWaitlistFormUrl(): string {
  return 'https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform';
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

    const apiUrl = `${API_BASE_URL}/api/waitlist`;
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
      
      // Try to parse the error response
      try {
        const errorData = await response.json();
        console.log('Error response data:', errorData);
        
        return { 
          success: false, 
          message: errorData.message || `API error: ${response.status} ${response.statusText}`,
          emailSent: false,
          fallbackUrl: errorData.fallbackUrl
        };
      } catch (parseError) {
        return { 
          success: false, 
          message: `API error: ${response.status} ${response.statusText}`,
          emailSent: false,
          fallbackUrl: getWaitlistFormUrl()
        };
      }
    }

    // Parse the response
    const data = await response.json();
    console.log('API response data:', data);
    
    // Return the result
    return {
      success: data.success,
      message: data.message,
      emailSent: data.emailSent,
      fallbackUrl: data.fallbackUrl,
      alreadyExists: data.alreadyExists
    };
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return { 
      success: false, 
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      emailSent: false,
      fallbackUrl: getWaitlistFormUrl()
    };
  }
}
