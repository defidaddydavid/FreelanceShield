// Root API endpoint for FreelanceShield
// This is a simple test endpoint to verify API routing

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return success with timestamp and environment info
  return res.status(200).json({
    success: true,
    message: 'FreelanceShield API is working',
    timestamp: new Date().toISOString(),
    path: '/api',
    method: req.method,
    env: process.env.NODE_ENV || 'unknown',
    // Check environment variables without exposing values
    envCheck: {
      hasSupabaseUrl: !!process.env.STORAGE_SUPABASE_URL,
      hasSupabaseKey: !!process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY,
      hasZohoEmail: !!process.env.ZOHO_EMAIL,
      hasZohoPassword: !!process.env.ZOHO_PASSWORD
    }
  });
};
