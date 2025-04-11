// Local test script for waitlist API
// This script tests the API handler directly without HTTP

require('dotenv').config();
const handler = require('./freelance-safeguard/api/waitlist-signup');

// Mock request and response objects
const mockReq = {
  method: 'POST',
  body: {
    email: `test-${Date.now()}@example.com`
  }
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    console.log(`Response status: ${code}`);
    return this;
  },
  json: function(data) {
    console.log('Response data:', JSON.stringify(data, null, 2));
    return this;
  },
  setHeader: function(name, value) {
    console.log(`Setting header: ${name}: ${value}`);
  },
  end: function() {
    console.log('Response ended');
  }
};

// Test the handler function
async function testHandler() {
  console.log('=== Testing Waitlist API Handler Locally ===');
  console.log(`Testing with email: ${mockReq.body.email}`);
  
  try {
    // Check environment variables
    console.log('\nEnvironment variables:');
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ZOHO_USER',
      'ZOHO_PASS',
      'ZOHO_HOST',
      'ZOHO_PORT'
    ];
    
    let allVarsExist = true;
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        console.warn(`⚠️ Missing: ${varName}`);
        allVarsExist = false;
      } else {
        console.log(`✅ Found: ${varName}`);
      }
    }
    
    if (!allVarsExist) {
      console.log('\n⚠️ Some environment variables are missing. Test may fail.');
    }
    
    // Call the handler function
    console.log('\nCalling API handler...');
    await handler(mockReq, mockRes);
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('\n❌ Error testing handler:', error);
  }
}

// Run the test
testHandler();
