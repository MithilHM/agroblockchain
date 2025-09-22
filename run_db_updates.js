const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '/app/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDatabaseUpdates() {
  try {
    console.log('Reading database updates...');
    const sql = fs.readFileSync('/app/database_updates.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`Executing ${statements.length} database statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`Statement ${i + 1} completed successfully`);
        }
      } catch (err) {
        console.error(`Exception in statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }
    
    console.log('Database updates process completed');
    
    // Test if tables exist
    console.log('Testing table existence...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['notifications', 'batch_offers', 'quality_checks', 'file_uploads']);
      
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    } else {
      console.log('Existing tables:', tables.map(t => t.table_name));
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runDatabaseUpdates();