// Simple test API endpoint
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return a simple response
  return res.status(200).json({ 
    success: true, 
    message: 'API test endpoint is working',
    method: req.method,
    body: req.body,
    env: {
      hasSupabaseUrl: !!process.env.STORAGE_SUPABASE_URL,
      hasSupabaseKey: !!process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY,
      hasZohoEmail: !!process.env.ZOHO_EMAIL,
      hasZohoPassword: !!process.env.ZOHO_PASSWORD
    }
  });
}
