// API endpoint for the waitlist service
export const WAITLIST_API_ENDPOINT = import.meta.env.VITE_WAITLIST_API_ENDPOINT || 
  (import.meta.env.PROD 
    ? '/api/waitlist' 
    : '/api/waitlist');

// Google Form URL for more detailed information
export const WAITLIST_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform?embedded=true";

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

    console.log(`Sending waitlist signup request to: ${WAITLIST_API_ENDPOINT}`);
    
    // Call the API endpoint
    const response = await fetch(WAITLIST_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Waitlist API error (${response.status}): ${errorText}`);
      return { 
        success: false, 
        message: 'Failed to join waitlist. Please try again later.' 
      };
    }
    
    const data = await response.json();
    return { 
      success: data.success, 
      message: data.message || 'Thank you for joining our waitlist!'
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
export async function getWaitlistSubscribers(): Promise<{ email: string, timestamp: Date }[]> {
  try {
    // Call the API endpoint
    const response = await fetch(WAITLIST_API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Waitlist API error (${response.status}): ${errorText}`);
      throw new Error('Failed to retrieve waitlist subscribers');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting waitlist subscribers:', error);
    throw error;
  }
}

/**
 * Export waitlist as CSV - Admin function, requires backend access
 * @returns CSV string of waitlist emails or error message
 */
export async function exportWaitlistCSV(): Promise<{ success: boolean; data?: string; message?: string }> {
  try {
    // Call the API endpoint with export flag
    const response = await fetch(`${WAITLIST_API_ENDPOINT}/export`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}` // Simple admin auth
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Waitlist export error (${response.status}): ${errorText}`);
      return { 
        success: false, 
        message: 'Failed to export waitlist data. Please check your permissions.' 
      };
    }
    
    const data = await response.text();
    return { 
      success: true, 
      data
    };
  } catch (error) {
    console.error('Error exporting waitlist:', error);
    return { 
      success: false, 
      message: 'Failed to export waitlist data. Please try again later.' 
    };
  }
}
