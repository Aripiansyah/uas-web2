// server/config/supabase.js

const { createClient } = require('@supabase/supabase-js');

const rawUrl = process.env.SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabase };
