// Test script for FreelanceShield Waitlist API
// This script tests the connection to Supabase and the API endpoint

// Load environment variables from test-env.js
import './test-env.js';

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ymsimbeqrvupvmujzrrd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const API_ENDPOINT = process.env.API_ENDPOINT || 'https://freelance-shield-ou99i0do3-defidaddydavids-projects.vercel.app/api/waitlist-signup';

// Generate a unique test email
const testEmail = `test-${Date.now()}@example.com`;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

console.log('=== FreelanceShield Waitlist API Test ===');
console.log('Testing with the following configuration:');
console.log(`- Supabase URL: ${SUPABASE_URL}`);
console.log(`- Supabase Key configured: ${!!SUPABASE_KEY}`);
console.log(`- API Endpoint: ${API_ENDPOINT}`);
console.log('');

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    // Use a simple query instead of an aggregate function
    const { data, error } = await supabase
      .from('waitlist')
      .select('email')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    console.log(`📊 Waitlist table can be accessed`);
    return true;
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    return false;
  }
}

// Test API endpoint
async function testApiEndpoint() {
  try {
    console.log(`\n🔍 Testing API endpoint with email: ${testEmail}...`);
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ API test failed:');
      console.log(`  Status: ${response.status}`);
      console.log(`  Message: ${data.message || 'No error message provided'}`);
      if (data.error) {
        console.log(`  Error: ${data.error}`);
      }
      return false;
    }
    
    console.log('✅ API test successful:');
    console.log(`  Status: ${response.status}`);
    console.log(`  Message: ${data.message || 'No message provided'}`);
    
    // Check if email was sent
    if (data.emailSent) {
      console.log('✉️  A confirmation email was sent');
    } else if (data.email_sent) {
      console.log('✉️  A confirmation email was sent');
    } else {
      console.log('⚠️  No confirmation email was sent (check Zoho Mail configuration)');
    }
    
    // Check if already exists
    if (data.alreadyExists) {
      console.log('⚠️  Email already exists in waitlist');
    }
    
    return true;
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    return false;
  }
}

// Verify email was added to Supabase
async function verifyEmailInSupabase() {
  try {
    console.log(`\n🔍 Verifying email was added to Supabase: ${testEmail}...`);
    
    // Small delay to ensure record is written
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data, error } = await supabase
      .from('waitlist')
      .select('email, created_at')
      .eq('email', testEmail)
      .limit(1);
    
    if (error) {
      console.log('❌ Email verification failed:', error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Email found in waitlist table:');
      console.log(`  Email: ${data[0].email}`);
      console.log(`  Created: ${new Date(data[0].created_at).toLocaleString()}`);
      return true;
    } else {
      console.log('❌ Email not found in waitlist table');
      return false;
    }
  } catch (error) {
    console.log('❌ Email verification failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('Running tests...\n');
  
  let supabaseConnected = await testSupabaseConnection();
  let apiWorking = false;
  let emailVerified = false;
  
  if (supabaseConnected) {
    apiWorking = await testApiEndpoint();
    
    if (apiWorking) {
      emailVerified = await verifyEmailInSupabase();
    }
  }
  
  console.log('\n=== Test Results ===');
  console.log(`Supabase Connection: ${supabaseConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`API Endpoint: ${apiWorking ? '✅ Working' : '❌ Failed'}`);
  
  if (apiWorking) {
    console.log(`Email Verification: ${emailVerified ? '✅ Verified' : '❌ Not Found'}`);
  }
  
  // Provide troubleshooting guidance based on test results
  if (!supabaseConnected) {
    console.log('\n🔧 Troubleshooting Supabase Connection:');
    console.log('1. Check if your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are correct');
    console.log('2. Verify that your IP is allowed to access Supabase (check Supabase dashboard)');
    console.log('3. Ensure the waitlist table exists in your Supabase database');
  }
  
  if (!apiWorking) {
    console.log('\n🔧 Troubleshooting API Endpoint:');
    console.log('1. Check if your API is properly deployed to Vercel');
    console.log('2. Verify that the API endpoint URL is correct');
    console.log('3. Check Vercel logs for any deployment or runtime errors');
    console.log('4. Ensure your API is using the correct export format for Vercel serverless functions');
    console.log('   (export default function handler(req, res) {...} instead of module.exports)');
  }
  
  if (apiWorking && !emailVerified) {
    console.log('\n🔧 Troubleshooting Email Verification:');
    console.log('1. Check if the test email is being sent to the correct API endpoint');
    console.log('2. Verify that the logWaitlistSignup function in your API is working correctly');
    console.log('3. Ensure that there are no permission issues with inserting into the waitlist table');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test script error:', error);
});
