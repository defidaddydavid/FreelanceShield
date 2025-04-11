// Simple direct test of the waitlist API
// This script tests the API directly without any dependencies

// Load environment variables
require('./test-env');

const fetch = require('node-fetch');

// Test email with timestamp to avoid duplicates
const testEmail = `test-${new Date().getTime()}@example.com`;

// Test both local development and production endpoints
const endpoints = [
  'http://localhost:3000/api/waitlist-signup',
  'https://freelanceshield.xyz/api/waitlist-signup'
];

async function testEndpoint(url) {
  console.log(`\n=== Testing endpoint: ${url} ===`);
  console.log(`Sending test email: ${testEmail}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    console.log(`Response status: ${response.status}`);
    
    const data = await response.text();
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(data);
      console.log('Response data:', JSON.stringify(jsonData, null, 2));
      return { success: response.ok, data: jsonData };
    } catch (e) {
      // If not JSON, return as text
      console.log('Response text:', data);
      return { success: response.ok, text: data };
    }
  } catch (error) {
    console.error(`Error connecting to ${url}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('=== FreelanceShield Direct API Test ===');
  console.log(`Testing with email: ${testEmail}`);
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`Test result for ${endpoint}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  }
  
  console.log('\n=== Test Complete ===');
}

runTests().catch(console.error);
