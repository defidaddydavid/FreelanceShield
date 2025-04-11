// Local test script for the waitlist API
// This runs the API handler directly without HTTP

// Load environment variables
require('./test-env');

const { createClient } = require('@supabase/supabase-js');
const handler = require('./freelance-safeguard/api/waitlist-handler.cjs');

// Mock request and response objects
const mockReq = {
  method: 'POST',
  body: {
    email: `test-${Date.now()}@example.com`
  },
  headers: {
    'content-type': 'application/json'
  }
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    console.log(`Response status: ${code}`);
    return this;
  },
  json: function(data) {
    this.data = data;
    console.log('Response data:', data);
    return this;
  },
  setHeader: function(name, value) {
    if (!this.headers) this.headers = {};
    this.headers[name] = value;
    return this;
  },
  end: function() {
    console.log('Response ended');
    return this;
  }
};

// Test the handler directly
async function testHandler() {
  console.log('=== Testing Waitlist API Handler Directly ===');
  console.log(`Testing with email: ${mockReq.body.email}`);
  
  try {
    // Call the handler directly
    await handler(mockReq, mockRes);
    
    // Check the response
    if (mockRes.statusCode === 200 && mockRes.data && mockRes.data.success) {
      console.log('✅ API handler executed successfully');
      console.log('Message:', mockRes.data.message);
      
      if (mockRes.data.email_sent) {
        console.log('✅ Email was sent successfully');
      } else {
        console.log('⚠️ Email was not sent, but database operation succeeded');
        if (mockRes.data.email_error) {
          console.log('Email error:', mockRes.data.email_error);
        }
      }
      
      return true;
    } else {
      console.log('❌ API handler returned an error');
      console.log('Status code:', mockRes.statusCode);
      console.log('Error message:', mockRes.data && mockRes.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error executing API handler:', error);
    return false;
  }
}

// Verify the email was added to Supabase
async function verifyEmailInSupabase() {
  console.log('\n--- Verifying Email in Supabase ---');
  
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY, 
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );
    
    // Check if the test email exists in the waitlist table
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('email', mockReq.body.email)
      .limit(1);
    
    if (error) {
      console.log('❌ Failed to verify email in Supabase:', error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Successfully verified email ${mockReq.body.email} in Supabase`);
      console.log('Entry data:', data[0]);
      return true;
    } else {
      console.log(`❌ Email ${mockReq.body.email} not found in Supabase waitlist`);
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to verify email in Supabase:', error.message);
    return false;
  }
}

// Run the tests
async function runTests() {
  const handlerSuccess = await testHandler();
  
  // Wait a moment for the database operation to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Only verify in Supabase if the handler test was successful
  let emailVerified = false;
  if (handlerSuccess) {
    emailVerified = await verifyEmailInSupabase();
  }
  
  console.log('\n=== Test Complete ===');
  console.log(`API Handler: ${handlerSuccess ? '✅ Working' : '❌ Failed'}`);
  
  if (handlerSuccess) {
    console.log(`Email Verification: ${emailVerified ? '✅ Verified' : '❌ Not Found'}`);
  }
  
  // Provide troubleshooting guidance
  if (!handlerSuccess) {
    console.log('\n🔧 Troubleshooting API Handler:');
    console.log('1. Check for any errors in the handler function');
    console.log('2. Verify that the Supabase connection is working');
    console.log('3. Ensure all required environment variables are set');
  }
  
  if (handlerSuccess && !emailVerified) {
    console.log('\n🔧 Troubleshooting Email Verification:');
    console.log('1. Check if the API is correctly connecting to Supabase');
    console.log('2. Verify that the RLS policies allow inserting into the waitlist table');
    console.log('3. Check for any database errors in the logs');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test script error:', error);
});
