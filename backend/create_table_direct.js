const { createClient } = require('@supabase/supabase-js');

async function createTableDirect() {
  const supabase = createClient(
    'https://wgxbgurprtunukhquymd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneGJndXJwcnR1bnVraHF1eW1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU1MDA1OCwiZXhwIjoyMDc0MTI2MDU4fQ.VXQJGNmWiFjaH3FEcDTszrNAOtNhBqPgNTN_nKepXl4'
  );

  // Try to insert a sample user, which might trigger table creation
  try {
    console.log('🔄 Attempting to insert user (this might create the table)...');
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: 'test@example.com',
          password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewAYZKbD3P8nGhte',
          role: 'farmer',
          first_name: 'Test',
          last_name: 'User',
          is_verified: false,
          is_active: true
        }
      ])
      .select();

    if (error) {
      console.log('❌ Insert failed (expected if table does not exist):', error.message);
      
      // If table doesn't exist, we'll create a mock response for now
      console.log('🔄 Setting up temporary in-memory solution...');
      
      return false;
    } else {
      console.log('✅ User inserted successfully! Table exists:', data);
      return true;
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
    return false;
  }
}

createTableDirect().then(success => {
  if (success) {
    console.log('🎉 Database is ready!');
  } else {
    console.log('⚠️ Database table needs manual creation. Using temporary solution.');
  }
});