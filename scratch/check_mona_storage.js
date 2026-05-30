const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

// Mona ka OLD partner ID (jo delete hua tha)
const MONA_OLD_ID = '8a952bfb-d388-4e10-b7d6-ecc89d76a202';
// Mona ka CURRENT user ID  
const MONA_NEW_ID = '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e';

async function run() {
    console.log('=== Supabase Storage mein Mona ki images dhund rahe hain ===\n');
    
    // List all buckets
    const { data: buckets, error: buckErr } = await supabase.storage.listBuckets();
    if (buckErr) {
        console.error('Buckets error:', buckErr.message);
        return;
    }
    console.log('Available buckets:', buckets.map(b => b.name));

    for (const bucket of buckets) {
        console.log(`\n--- Bucket: ${bucket.name} ---`);
        
        // List files in Mona's OLD folder
        const { data: oldFiles, error: e1 } = await supabase.storage
            .from(bucket.name)
            .list(`products/${MONA_OLD_ID}`, { limit: 100 });
        
        if (oldFiles && oldFiles.length > 0) {
            console.log(`\n[FOUND] Mona OLD ID folder (${MONA_OLD_ID}):`);
            console.log(`  Total files: ${oldFiles.length}`);
            oldFiles.forEach((f, i) => {
                const url = supabase.storage.from(bucket.name).getPublicUrl(`products/${MONA_OLD_ID}/${f.name}`);
                console.log(`  [${i+1}] ${f.name}`);
                console.log(`       URL: ${url.data.publicUrl}`);
            });
        } else {
            console.log(`  OLD ID folder: Empty or not found`);
            if (e1) console.log(`  Error: ${e1.message}`);
        }
        
        // List files in Mona's NEW folder
        const { data: newFiles, error: e2 } = await supabase.storage
            .from(bucket.name)
            .list(`products/${MONA_NEW_ID}`, { limit: 100 });
        
        if (newFiles && newFiles.length > 0) {
            console.log(`\n[FOUND] Mona NEW ID folder (${MONA_NEW_ID}):`);
            console.log(`  Total files: ${newFiles.length}`);
            newFiles.forEach((f, i) => {
                const url = supabase.storage.from(bucket.name).getPublicUrl(`products/${MONA_NEW_ID}/${f.name}`);
                console.log(`  [${i+1}] ${f.name}`);
                console.log(`       URL: ${url.data.publicUrl}`);
            });
        } else {
            console.log(`  NEW ID folder: Empty or not found`);
        }
    }
}

run().catch(console.error);
