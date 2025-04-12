// API endpoint to test Supabase connection in Vercel environment
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log request details
  console.log('Supabase test endpoint called');
  
  try {
    // Check for environment variables
    const supabaseUrl = process.env.STORAGE_SUPABASE_URL;
    const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY;
    
    // Environment variable check
    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlPrefix: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'missing',
      supabaseKeyPrefix: supabaseKey ? supabaseKey.substring(0, 5) + '...' : 'missing'
    };
    
    // If environment variables are missing, return early
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        message: 'Supabase environment variables missing',
        envCheck
      });
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Test connection by querying waitlist table
    const { data, error, count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact' })
      .limit(3);
    
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error connecting to Supabase',
        error: error.message,
        envCheck
      });
    }
    
    // Return success with sample data (no sensitive info)
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to Supabase',
      recordCount: count,
      sampleData: data.map(item => ({
        id: item.id,
        createdAt: item.created_at,
        // Don't include actual emails for privacy
        emailDomain: item.email ? item.email.split('@')[1] : 'unknown'
      })),
      envCheck
    });
    
  } catch (error) {
    console.error('Exception in Supabase test endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Exception testing Supabase connection',
      error: error.message
    });
  }
};
