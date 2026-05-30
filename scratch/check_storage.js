const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log("Listing buckets...");
    const { data: buckets, error: err1 } = await supabase.storage.listBuckets();
    if (err1) {
      console.error("Error listing buckets:", err1);
      return;
    }

    console.log("Buckets:", buckets);

    for (const bucket of buckets) {
      console.log(`\nListing files in bucket "${bucket.name}"...`);
      // We can list files in the root of the bucket
      const { data: files, error: err2 } = await supabase.storage.from(bucket.name).list('', {
        limit: 100
      });
      if (err2) {
        console.error(`Error listing files in ${bucket.name}:`, err2.message);
      } else {
        console.log(`Files in ${bucket.name}:`, files.map(f => f.name));
      }
    }
  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

run();
