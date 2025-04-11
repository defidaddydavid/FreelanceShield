// Test script for Supabase connection and email sending
// Load environment variables first
require('./test-env');

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Email configuration
const ZOHO_USER = process.env.ZOHO_USER;
const ZOHO_PASS = process.env.ZOHO_PASS;

// For EU-hosted domain-based emails with Zoho Mail
const ZOHO_HOST = 'smtp.zoho.eu'; // EU server for EU-hosted domains
const ZOHO_PORT = 465; // Use 465 for SSL
const ZOHO_USE_SSL = true; // Use SSL for port 465

async function runTests() {
  console.log('=== FreelanceShield Supabase Connection Test ===');
  console.log('Testing with the following configuration:');
  console.log(`- Supabase URL: ${SUPABASE_URL}`);
  console.log(`- Supabase Key configured: ${!!SUPABASE_SERVICE_ROLE_KEY}`);
  console.log(`- Zoho Email: ${ZOHO_USER}`);
  console.log(`- Zoho Password configured: ${!!ZOHO_PASS}`);
  
  // Test 1: Check Supabase connection
  console.log('\n--- Test 1: Supabase Connection ---');
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
    } else {
      console.log('✅ Successfully connected to Supabase');
      console.log(`Successfully retrieved a waitlist entry`);
    }
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error.message);
  }
  
  // Test 2: Try inserting a test record
  console.log('\n--- Test 2: Insert Test Record ---');
  const testEmail = `test-${new Date().getTime()}@example.com`;
  
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .insert([{ 
        email: testEmail,
        source: 'test-script' 
      }])
      .select();
      
    if (error) {
      console.error('❌ Failed to insert test record:', error.message);
    } else {
      console.log(`✅ Successfully inserted test email: ${testEmail}`);
      console.log('Record:', data);
    }
  } catch (error) {
    console.error('❌ Error inserting test record:', error.message);
  }
  
  // Test 3: Check email sending
  console.log('\n--- Test 3: Email Sending ---');
  
  if (!ZOHO_PASS) {
    console.log('⚠️ ZOHO_PASS not configured, skipping email test');
  } else {
    try {
      console.log('Attempting to connect to Zoho Mail with EU domain settings...');
      
      // Create a test transporter with SSL options for EU domain
      const transporter = nodemailer.createTransport({
        host: ZOHO_HOST,
        port: ZOHO_PORT,
        secure: ZOHO_USE_SSL,
        auth: {
          user: ZOHO_USER,
          pass: ZOHO_PASS
        },
        tls: {
          // Required for some Zoho Mail configurations
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        debug: true,
        logger: true
      });
      
      console.log('Using Zoho Mail with account:', ZOHO_USER);
      console.log('SMTP Host:', ZOHO_HOST);
      console.log('SMTP Port:', ZOHO_PORT);
      console.log('Using SSL:', ZOHO_USE_SSL);
      
      try {
        console.log('Attempting to verify email configuration...');
        const verified = await transporter.verify();
        
        if (verified) {
          console.log('✅ Email configuration verified successfully');
          
          // Try sending a test email
          console.log('Sending test email...');
          const info = await transporter.sendMail({
            from: `"FreelanceShield" <${ZOHO_USER}>`,
            to: ZOHO_USER, // Send to yourself for testing
            subject: 'FreelanceShield Email Test',
            html: `
              <div style="font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a18; color: #ffffff; border-radius: 8px; border: 1px solid #9945FF;">
                <h1 style="font-family: 'NT Brick Sans', Arial, sans-serif; color: #9945FF; font-size: 24px;">FreelanceShield Email Test</h1>
                <p>This is a test email to verify the email sending functionality.</p>
                <p>Test completed at: ${new Date().toISOString()}</p>
              </div>
            `
          });
          
          console.log('✅ Test email sent successfully');
          console.log('Message ID:', info.messageId);
        } else {
          console.error('❌ Email configuration verification failed');
        }
      } catch (verifyError) {
        console.error('❌ Email verification error:', verifyError.message);
        
        // Check for specific Zoho Mail errors
        if (verifyError.message.includes('535 Authentication Failed')) {
          console.log('\n⚠️ IMPORTANT: Authentication failed with Zoho Mail');
          console.log('1. Check if your Zoho Mail account has 2FA enabled');
          console.log('2. Verify that your account has SMTP access enabled');
          console.log('3. Try using the Zoho Mail web interface to ensure your account is active');
          console.log('4. Contact Zoho support if issues persist');
        }
      }
    } catch (error) {
      console.error('❌ Error setting up email test:', error.message);
      console.error('Error details:', error);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

runTests().catch(console.error);
