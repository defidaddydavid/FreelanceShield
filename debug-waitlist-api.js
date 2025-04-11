// Debug script for the waitlist API
// This script tests the API endpoint with detailed logging

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Configuration
const API_ENDPOINT = 'https://freelanceshield.xyz/api/waitlist-signup';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ymsimbeqrvupvmujzrrd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Generate a unique test email
const testEmail = `test-${Date.now()}@example.com`;

// Initialize Supabase client if credentials are available
const supabase = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
}) : null;

// Test the API endpoint with detailed debugging
async function debugApiEndpoint() {
  console.log('=== FreelanceShield Waitlist API Debug ===');
  console.log(`Testing with email: ${testEmail}`);
  console.log(`API Endpoint: ${API_ENDPOINT}`);
  
  try {
    // 1. Test direct API connection
    console.log('\n--- Testing Direct API Connection ---');
    const directResponse = await fetch(API_ENDPOINT, {
      method: 'OPTIONS',
      headers: { 'Origin': 'https://freelanceshield.xyz' }
    });
    
    console.log(`CORS Preflight Status: ${directResponse.status} ${directResponse.statusText}`);
    console.log('CORS Headers:');
    directResponse.headers.forEach((value, name) => {
      if (name.toLowerCase().includes('access-control')) {
        console.log(`  ${name}: ${value}`);
      }
    });
    
    // 2. Send the actual request
    console.log('\n--- Sending Test Request to API ---');
    console.log(`Request Body: ${JSON.stringify({ email: testEmail })}`);
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://freelanceshield.xyz'
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    // Log response details
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    const headers = {};
    response.headers.forEach((value, name) => {
      headers[name] = value;
    });
    console.log('Response Headers:', headers);
    
    // Parse response body
    const responseText = await response.text();
    console.log(`Raw Response Body: ${responseText}`);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed Response:', responseData);
    } catch (parseError) {
      console.error(`Failed to parse response as JSON: ${parseError.message}`);
    }
    
    // 3. Check Supabase directly if credentials are available
    if (supabase) {
      console.log('\n--- Checking Supabase Directly ---');
      try {
        // Wait a moment to allow the API to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data, error } = await supabase
          .from('waitlist')
          .select('*')
          .eq('email', testEmail)
          .maybeSingle();
        
        if (error) {
          console.error('Error querying Supabase:', error.message);
        } else if (data) {
          console.log('✅ Email found in Supabase waitlist table:');
          console.log(data);
        } else {
          console.log('❌ Email NOT found in Supabase waitlist table');
          
          // Check if table exists and permissions are correct
          const { data: tableInfo, error: tableError } = await supabase
            .from('waitlist')
            .select('count(*)')
            .limit(1);
          
          if (tableError) {
            console.error('Error accessing waitlist table:', tableError.message);
            console.log('This may indicate a permissions issue with the Supabase service role key');
          } else {
            console.log('Waitlist table exists and is accessible');
          }
        }
      } catch (dbError) {
        console.error('Error checking Supabase:', dbError.message);
      }
    } else {
      console.log('\n⚠️ Supabase credentials not provided - skipping direct database check');
    }
    
    // 4. Provide troubleshooting guidance
    console.log('\n=== Troubleshooting Guidance ===');
    
    if (!response.ok) {
      console.log('API returned an error. Possible issues:');
      
      if (response.status === 500) {
        console.log('1. Server-side error in the API handler');
        console.log('2. Missing or incorrect environment variables on the server');
        console.log('3. Database connection issues');
        console.log('4. Email service configuration problems');
      } else if (response.status === 404) {
        console.log('1. API endpoint URL is incorrect or not deployed');
        console.log('2. Routing issue in Vercel configuration');
      } else if (response.status === 403) {
        console.log('1. CORS configuration issue');
        console.log('2. API permissions are restricted');
      }
      
      console.log('\nRecommended actions:');
      console.log('1. Check Vercel logs for detailed error information');
      console.log('2. Verify all environment variables are set correctly in Vercel');
      console.log('3. Ensure the API handler is properly deployed');
      console.log('4. Check Supabase connection and permissions');
    } else if (responseData && !responseData.success) {
      console.log('API processed the request but returned a failure. Possible issues:');
      console.log('1. Email validation failed');
      console.log('2. Database operation failed');
      console.log('3. Email sending failed');
      
      if (responseData.error) {
        console.log(`\nError details: ${responseData.error}`);
      }
    } else {
      console.log('✅ API request was successful, but frontend still shows an error.');
      console.log('Possible frontend issues:');
      console.log('1. CORS issues preventing the frontend from receiving the response');
      console.log('2. Error in the frontend code handling the response');
      console.log('3. Network issues between the frontend and API');
    }
    
  } catch (error) {
    console.error(`❌ Error testing API endpoint: ${error.message}`);
    console.log('\nThis likely indicates a network connectivity issue or the API is not accessible');
  }
}

// Run the debug function
debugApiEndpoint();
