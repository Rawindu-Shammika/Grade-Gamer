require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_schema_details_or_query_columns');
  // If RPC doesn't exist, let's query a row and inspect its keys
  const r1 = await supabase.from('roster_matches').select('*').limit(1);
  const r2 = await supabase.from('match_lineup').select('*').limit(1);
  
  console.log('roster_matches row keys:', r1.data?.[0] ? Object.keys(r1.data[0]) : 'No rows');
  console.log('match_lineup row keys:', r2.data?.[0] ? Object.keys(r2.data[0]) : 'No rows');

  // Let's do a postgrest request to get table schema/metadata or just insert empty and inspect error
  const testInsert = await supabase.from('roster_matches').insert({}).select();
  console.log('roster_matches insert error details:', testInsert.error);
  const testInsert2 = await supabase.from('match_lineup').insert({}).select();
  console.log('match_lineup insert error details:', testInsert2.error);
}
check();
