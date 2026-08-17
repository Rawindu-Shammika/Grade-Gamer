require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔄 Connecting to Supabase project:', supabaseUrl);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, unique_account_id, in_game_name, email')
      .limit(5);

    if (error) {
      console.error('❌ Supabase Query Error:', error.message);
      console.error('Details:', error);
      process.exit(1);
    }

    console.log('✅ Connection Successful! Connected to GradeGamer Supabase instance.');
    console.log(`📊 Found ${data.length} profile record(s):`);
    console.dir(data, { depth: null });
    process.exit(0);
  } catch (err) {
    console.error('❌ Network/Unexpected Error:', err.message);
    process.exit(1);
  }
}

testConnection();
