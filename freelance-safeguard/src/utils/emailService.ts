import nodemailer from 'nodemailer';

// Load environment variables from Vercel
// These will be accessed at runtime from Vercel's environment variables
const getEnvVariable = (key: string, defaultValue: string = ''): string => {
  // For client-side code, we need to use NEXT_PUBLIC_ prefix
  // But for server-side code in API routes, we can access directly
  return typeof process !== 'undefined' && process.env 
    ? (process.env[key] || defaultValue) 
    : defaultValue;
};

const ZOHO_EMAIL = getEnvVariable('ZOHO_EMAIL', '');
const ZOHO_PASSWORD = getEnvVariable('ZOHO_PASSWORD', '');
const ZOHO_SMTP_HOST = getEnvVariable('ZOHO_SMTP_HOST', 'smtp.zoho.com');
const ZOHO_SMTP_PORT = parseInt(getEnvVariable('ZOHO_SMTP_PORT', '465'));
const ZOHO_SMTP_SECURE = getEnvVariable('ZOHO_SMTP_SECURE', 'true') === 'true';
const WAITLIST_EMAIL_SUBJECT = getEnvVariable('WAITLIST_EMAIL_SUBJECT', 'Welcome to FreelanceShield Waitlist!');
const WAITLIST_FROM_NAME = getEnvVariable('WAITLIST_FROM_NAME', 'FreelanceShield Team');

// Create a transporter object
const createTransporter = () => {
  // Only create the transporter if we're in a server environment
  if (typeof window !== 'undefined') {
    console.log('Email service running in browser environment, transport creation skipped');
    return null;
  }

  return nodemailer.createTransport({
    host: ZOHO_SMTP_HOST,
    port: ZOHO_SMTP_PORT,
    secure: ZOHO_SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: ZOHO_EMAIL,
      pass: ZOHO_PASSWORD,
    },
  });
};

/**
 * Send a welcome email to a new waitlist subscriber
 * @param email The recipient's email address
 * @returns Promise that resolves to success status and message
 */
export async function sendWaitlistWelcomeEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.log('Email service running in browser environment, email sending skipped');
      return { 
        success: false, 
        message: 'Email service not available in browser environment' 
      };
    }

    if (!ZOHO_EMAIL || !ZOHO_PASSWORD) {
      console.error('Zoho email credentials not configured');
      return { 
        success: false, 
        message: 'Email service not configured properly' 
      };
    }

    const transporter = createTransporter();
    
    if (!transporter) {
      return { 
        success: false, 
        message: 'Email transport could not be created' 
      };
    }

    // Email content
    const mailOptions = {
      from: `"${WAITLIST_FROM_NAME}" <${ZOHO_EMAIL}>`,
      to: email,
      subject: WAITLIST_EMAIL_SUBJECT,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #9945FF; margin-bottom: 10px;">FreelanceShield</h1>
            <p style="font-size: 18px; color: #555;">Thank you for joining our waitlist!</p>
          </div>
          
          <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p>Hello,</p>
            <p>We're excited to have you join the FreelanceShield waitlist. You're now among the first to know when we launch our platform that will revolutionize freelance work with blockchain-powered security.</p>
            <p>Here's what you can look forward to:</p>
            <ul>
              <li>Smart Contract Protection</li>
              <li>Secure Escrow Services</li>
              <li>Reputation System</li>
              <li>Decentralized Arbitration</li>
            </ul>
            <p>We'll keep you updated on our progress and notify you as soon as we're ready to launch.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #777; font-size: 14px;">
            <p>Follow us on social media for the latest updates:</p>
            <p>
              <a href="https://twitter.com/freelanceshield" style="color: #9945FF; text-decoration: none; margin: 0 10px;">Twitter</a> | 
              <a href="https://linkedin.com/company/freelanceshield" style="color: #9945FF; text-decoration: none; margin: 0 10px;">LinkedIn</a>
            </p>
            <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} FreelanceShield. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Waitlist welcome email sent:', info.messageId);
    
    return { 
      success: true, 
      message: 'Welcome email sent successfully' 
    };
  } catch (error) {
    console.error('Error sending waitlist welcome email:', error);
    return { 
      success: false, 
      message: 'Failed to send welcome email' 
    };
  }
}

/**
 * Send a notification email to the admin when someone joins the waitlist
 * @param subscriberEmail The email of the person who joined the waitlist
 * @returns Promise that resolves to success status and message
 */
export async function sendAdminNotificationEmail(subscriberEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.log('Email service running in browser environment, email sending skipped');
      return { 
        success: false, 
        message: 'Email service not available in browser environment' 
      };
    }

    if (!ZOHO_EMAIL || !ZOHO_PASSWORD) {
      console.error('Zoho email credentials not configured');
      return { 
        success: false, 
        message: 'Email service not configured properly' 
      };
    }

    const transporter = createTransporter();
    
    if (!transporter) {
      return { 
        success: false, 
        message: 'Email transport could not be created' 
      };
    }

    // Email content
    const mailOptions = {
      from: `"${WAITLIST_FROM_NAME}" <${ZOHO_EMAIL}>`,
      to: ZOHO_EMAIL, // Send to admin email
      subject: 'New Waitlist Signup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #9945FF;">New Waitlist Signup</h2>
          <p>A new user has joined the FreelanceShield waitlist:</p>
          <p><strong>Email:</strong> ${subscriberEmail}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent:', info.messageId);
    
    return { 
      success: true, 
      message: 'Admin notification sent successfully' 
    };
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return { 
      success: false, 
      message: 'Failed to send admin notification' 
    };
  }
}
