// Test script to check the deployed waitlist API
import fetch from 'node-fetch';

const testDeployedAPI = async () => {
  console.log('=== Testing Deployed Waitlist API ===');
  
  // The URLs to test - both direct and with /api/waitlist
  const urls = [
    'https://freelance-shield-ab094iczn-defidaddydavids-projects.vercel.app/api/waitlist-signup',
    'https://freelance-shield-ab094iczn-defidaddydavids-projects.vercel.app/api/waitlist',
    'https://freelanceshield.xyz/api/waitlist-signup',
    'https://freelanceshield.xyz/api/waitlist'
  ];
  
  // Test each URL
  for (const url of urls) {
    try {
      console.log(`\nTesting: ${url}`);
      
      // First try a simple GET to see what response we get (even if 404, we want to see headers)
      console.log('Sending GET request...');
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Status: ${getResponse.status} ${getResponse.statusText}`);
      
      // If the response is not HTML (likely JSON), parse it
      const contentType = getResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await getResponse.json();
        console.log('Response:', data);
      } else {
        // Otherwise just get the text (first 100 chars)
        const text = await getResponse.text();
        console.log('Response preview:', text.substring(0, 100) + '...');
      }
      
      // Then try an actual API request
      console.log('\nSending POST request...');
      const testEmail = `test-${Date.now()}@example.com`;
      
      const postResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      });
      
      console.log(`Status: ${postResponse.status} ${postResponse.statusText}`);
      
      try {
        const data = await postResponse.json();
        console.log('Response:', data);
      } catch (e) {
        // If we can't parse as JSON, show the text
        const text = await postResponse.text();
        console.log('Response preview:', text.substring(0, 100) + '...');
      }
    } catch (error) {
      console.error(`Error testing ${url}:`, error.message);
    }
  }
};

// Run the test
testDeployedAPI().catch(error => {
  console.error('Test script error:', error);
});
