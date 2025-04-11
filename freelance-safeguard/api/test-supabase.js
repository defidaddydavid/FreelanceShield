const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  try {
    // Test connection by fetching first 5 waitlist entries
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .limit(5);

    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      data,
      message: 'Supabase connection successful!'
    });
  } catch (error) {
    console.error('Supabase test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Supabase connection failed',
      error: error.message
    });
  }
};
