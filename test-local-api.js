// Test script for local waitlist API
const fetch = require('node-fetch');

// Test email with timestamp to avoid duplicates
const testEmail = `test-${new Date().getTime()}@example.com`;

async function testLocalApi() {
  console.log('=== Testing Local Waitlist API ===');
  console.log(`Sending test email: ${testEmail}`);
  
  try {
    const response = await fetch('http://localhost:3001/api/waitlist-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    console.log(`Response status: ${response.status}`);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error connecting to local API:', error.message);
    return { success: false, error: error.message };
  }
}

testLocalApi()
  .then(result => {
    console.log(`\nTest result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
