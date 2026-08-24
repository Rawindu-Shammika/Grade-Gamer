import { supabase } from './src/config/supabase.js';

async function check() {
  const { data, error } = await supabase
    .from('match_telemetry')
    .select('*')
    .limit(1);
  if (error) {
    console.error('ERROR CODE:', error.code);
    console.error('ERROR MESSAGE:', error.message);
  } else {
    console.log('match_telemetry table exists!');
  }
}
check();
