const { supabaseAdmin } = require('./backend/dist/config/supabase.js');

async function fixDatabase() {
  console.log('🔧 Fixing database schema...');
  
  try {
    // Add status column to users table
    console.log('Adding status column to users table...');
    const { error: statusError } = await supabaseAdmin
      .from('users')
      .select('status')
      .limit(1);
    
    if (statusError && statusError.code === '42703') {
      console.log('Status column does not exist, need to add it manually via Supabase dashboard');
    } else {
      console.log('✅ Status column exists');
    }
    
    // Add metadata column to users table
    console.log('Checking metadata column in users table...');
    const { error: metadataError } = await supabaseAdmin
      .from('users')
      .select('metadata')
      .limit(1);
    
    if (metadataError && metadataError.code === '42703') {
      console.log('Metadata column does not exist, need to add it manually via Supabase dashboard');
    } else {
      console.log('✅ Metadata column exists');
    }
    
    // Check if notifications table exists
    console.log('Checking notifications table...');
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .limit(1);
    
    if (notificationsError && notificationsError.code === 'PGRST205') {
      console.log('Notifications table does not exist, need to create it manually via Supabase dashboard');
    } else {
      console.log('✅ Notifications table exists');
    }
    
    // Check if batch_offers table exists
    console.log('Checking batch_offers table...');
    const { error: offersError } = await supabaseAdmin
      .from('batch_offers')
      .select('id')
      .limit(1);
    
    if (offersError && offersError.code === 'PGRST205') {
      console.log('Batch_offers table does not exist, need to create it manually via Supabase dashboard');
    } else {
      console.log('✅ Batch_offers table exists');
    }
    
    console.log('🎯 Database check completed');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

fixDatabase();