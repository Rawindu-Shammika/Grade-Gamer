import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manually parse .env from project root
const envPath = join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value.trim();
  }
});

const rawUrl = envVars.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  try {
    const { data: _authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'gamer_spec_55@gradegamer.edu',
      password: 'Password123!'
    });
    if (authError) {
      console.error('Login failed:', authError.message);
      return;
    }
    console.log('Login succeeded! Fetching teams...');
    const { data, error } = await supabase.from('teams').select('user_id, team_name');
    if (error) {
      console.error('Error fetching teams:', error.message);
    } else {
      console.log('Teams:', data);
    }
  } catch (err) {
    console.error('Error in checkDatabase:', err);
  }
}

checkDatabase();
