// Simple test API endpoint for FreelanceShield
// This is used to verify API routing is working correctly

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
    message: 'API test endpoint is working correctly',
    timestamp: new Date().toISOString(),
    path: '/api/v1/test',
    method: req.method,
    env: process.env.NODE_ENV || 'unknown'
  });
};
