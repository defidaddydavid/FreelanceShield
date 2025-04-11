// Test script to verify Supabase connection for FreelanceShield
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
// In a real environment, these would come from process.env
// For testing, you can replace these with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'https://ymsimbeqrvupvmujzrrd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Test function to query the waitlist table
async function testWaitlistConnection() {
  console.log('Testing Supabase connection to waitlist table...');
  
  try {
    // Attempt to count records in the waitlist table
    const { data, error, count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error connecting to waitlist table:', error);
      return false;
    }
    
    console.log(`Successfully connected to waitlist table. Found ${count} records.`);
    console.log('Sample data:', data.slice(0, 3)); // Show up to 3 records
    
    return true;
  } catch (err) {
    console.error('Exception during connection test:', err);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testWaitlistConnection()
    .then(success => {
      console.log(`Connection test ${success ? 'PASSED' : 'FAILED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error during test:', err);
      process.exit(1);
    });
}

module.exports = { testWaitlistConnection };
