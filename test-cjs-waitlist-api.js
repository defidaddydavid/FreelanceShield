// Test script for the updated CJS waitlist API
// This will test the API with the correct file extension

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Configuration
const API_ENDPOINT = 'https://freelanceshield.xyz/api/waitlist-signup.cjs';
const TEST_EMAIL = `test-${Date.now()}@example.com`;

// Test the API endpoint
async function testWaitlistApi() {
  console.log('=== Testing FreelanceShield Waitlist API (.cjs version) ===');
  console.log(`API Endpoint: ${API_ENDPOINT}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  
  try {
    console.log('\nSending test request...');
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://freelanceshield.xyz'
      },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    const headers = {};
    response.headers.forEach((value, name) => {
      headers[name] = value;
    });
    console.log('Response Headers:', headers);
    
    const responseText = await response.text();
    console.log(`Raw Response: ${responseText}`);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed Response:', data);
      
      if (data.success) {
        console.log('\n✅ API test successful!');
        console.log(`Email saved to database: ${data.database_saved}`);
        console.log(`Email sent: ${data.email_sent}`);
      } else {
        console.log('\n❌ API returned an error:');
        console.log(`Message: ${data.message}`);
        console.log(`Error: ${data.error || 'No error details provided'}`);
      }
    } catch (parseError) {
      console.error(`Failed to parse response as JSON: ${parseError.message}`);
    }
    
  } catch (error) {
    console.error(`Error testing API: ${error.message}`);
  }
}

// Run the test
testWaitlistApi();
