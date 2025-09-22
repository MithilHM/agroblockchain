const { createClient } = require('@supabase/supabase-js');

async function createTables() {
  const supabase = createClient(
    'https://wgxbgurprtunukhquymd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneGJndXJwcnR1bnVraHF1eW1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU1MDA1OCwiZXhwIjoyMDc0MTI2MDU4fQ.VXQJGNmWiFjaH3FEcDTszrNAOtNhBqPgNTN_nKepXl4'
  );

  // Try a simple table creation
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    console.log('Testing connection...');
    if (error) {
      console.log('Table does not exist, needs to be created:', error.message);
    } else {
      console.log('Users table already exists');
    }
  } catch (err) {
    console.log('Connection test result:', err.message);
  }
}

createTables();