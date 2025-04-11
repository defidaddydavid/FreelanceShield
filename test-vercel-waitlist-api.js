// Test script for the Vercel-deployed waitlist API
// This script tests the production API endpoint to verify it's working correctly

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize environment variables
dotenv.config();

// Configuration
const API_ENDPOINT = 'https://freelanceshield.xyz/api/waitlist-signup';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ymsimbeqrvupvmujzrrd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Generate a unique test email
const testEmail = `test-${Date.now()}@example.com`;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Verify that the email was added to Supabase
async function verifyEmailInSupabase(email) {
  console.log(`\n--- Verifying Email in Supabase ---`);
  
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Error verifying email in Supabase:', error.message);
      return false;
    }
    
    if (!data) {
      console.error(`❌ Email ${email} not found in Supabase waitlist table`);
      return false;
    }
    
    console.log(`✅ Successfully verified email ${email} in Supabase`);
    console.log('Entry data:', data);
    return true;
  } catch (error) {
    console.error('❌ Exception verifying email in Supabase:', error.message);
    return false;
  }
}

// Test the API endpoint
async function testApiEndpoint() {
  console.log('=== FreelanceShield Waitlist API Vercel Test ===');
  console.log(`Testing with email: ${testEmail}`);
  console.log(`API Endpoint: ${API_ENDPOINT}`);
  
  try {
    // Send the request
    console.log('\n--- Sending Request to API ---');
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    // Log response status and headers
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    const headers = {};
    response.headers.forEach((value, name) => {
      headers[name] = value;
    });
    console.log('Response headers:', headers);
    
    // Parse response body
    let responseData;
    const responseText = await response.text();
    
    try {
      responseData = JSON.parse(responseText);
      console.log('Response data:', responseData);
      
      if (responseData.success) {
        console.log('✅ API request successful');
        console.log(`Message: ${responseData.message}`);
        
        if (responseData.email_sent) {
          console.log('✅ Email was sent successfully');
        } else {
          console.warn(`⚠️ Email was not sent: ${responseData.email_error || 'Unknown error'}`);
        }
      } else {
        console.error(`❌ API request failed: ${responseData.message}`);
        if (responseData.error) {
          console.error(`Error details: ${responseData.error}`);
        }
      }
    } catch (parseError) {
      console.error(`❌ Failed to parse response as JSON: ${parseError.message}`);
      console.log(`Raw response: ${responseText}`);
    }
    
    // Verify the email was added to Supabase
    if (response.ok) {
      await verifyEmailInSupabase(testEmail);
    }
    
    // Print test summary
    console.log('\n=== Test Summary ===');
    console.log(`API Response: ${response.ok ? '✅ Success' : '❌ Failed'}`);
    console.log(`Status Code: ${response.status}`);
    if (responseData) {
      console.log(`Success Flag: ${responseData.success ? '✅ True' : '❌ False'}`);
      console.log(`Email Sent: ${responseData.email_sent ? '✅ Yes' : '❌ No'}`);
      console.log(`Database Saved: ${responseData.database_saved ? '✅ Yes' : '❌ No'}`);
    }
    
    // Provide troubleshooting guidance if needed
    if (!response.ok) {
      console.log('\n🔧 Troubleshooting Suggestions:');
      if (response.status === 500) {
        console.log('1. Check Vercel logs for detailed error information');
        console.log('2. Verify that all environment variables are set correctly in Vercel');
        console.log('3. Make sure the API handler is properly exported as an ES module');
        console.log('4. Check Supabase connection and permissions');
      } else if (response.status === 404) {
        console.log('1. Verify the API endpoint URL is correct');
        console.log('2. Check that the API file is in the correct location in your project');
        console.log('3. Ensure the Vercel deployment completed successfully');
      }
    }
    
  } catch (error) {
    console.error(`❌ Error testing API endpoint: ${error.message}`);
  }
}

// Run the test
testApiEndpoint();
