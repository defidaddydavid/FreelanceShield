// Simple in-memory waitlist storage
// In a production environment, you would use a database or external service
let waitlistEmails: string[] = [];
let subscribers: Map<string, { email: string, timestamp: Date }> = new Map();

/**
 * Add an email to the waitlist
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
    
    // In a production environment, you would:
    // 1. Connect to a database or third-party service (e.g., Mailchimp, ConvertKit)
    // 2. Implement proper error handling and retries
    // 3. Add email validation and spam protection
    // 4. Set up email confirmation flow

    console.log(`Added to waitlist: ${email}`);
    return { success: true, message: 'Successfully added to waitlist' };
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
export function getWaitlistSubscribers(): Array<{ email: string, timestamp: Date }> {
  return Array.from(subscribers.values());
}

/**
 * Export waitlist as CSV
 * @returns CSV string of waitlist emails
 */
export function exportWaitlistCSV(): string {
  const headers = 'Email,Timestamp\n';
  const rows = Array.from(subscribers.values())
    .map(({ email, timestamp }) => `${email},${timestamp.toISOString()}`)
    .join('\n');
  
  return headers + rows;
}
