const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking package_payments columns...");
  // Let's insert a dummy row and see the error or query the API.
  const { data, error } = await supabase
    .from('package_payments')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Select error:", error);
  } else {
    console.log("Fetched sample data:", data);
  }
}

main().catch(console.error);
