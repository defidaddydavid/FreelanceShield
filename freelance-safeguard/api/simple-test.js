// A simple test endpoint that just returns a success response
// No database or email operations

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log request details
  console.log('Simple test endpoint called');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Return success for any request method
  return res.status(200).json({
    success: true,
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method
  });
};
