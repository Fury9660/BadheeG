const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

const MONA_OLD_ID = '8a952bfb-d388-4e10-b7d6-ecc89d76a202';
const MONA_NEW_ID = '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e';
const BUCKET = 'product-images';

async function run() {
    console.log('=== product-images bucket mein Mona ke folders dhund rahe hain ===\n');
    
    // List products/ folder
    const { data: productsFolder, error } = await supabase.storage
        .from(BUCKET)
        .list('products', { limit: 200 });
    
    if (error) {
        console.error('Error listing products:', error.message);
        return;
    }
    
    console.log(`products/ folder mein total entries: ${productsFolder?.length || 0}`);
    productsFolder?.forEach(f => {
        console.log(`  - ${f.name} (${f.metadata ? 'file' : 'folder'})`);
    });
    
    // Check specifically for Mona's OLD ID folder
    console.log(`\n--- Mona OLD ID (${MONA_OLD_ID}) ---`);
    const { data: monaFiles, error: mErr } = await supabase.storage
        .from(BUCKET)
        .list(`products/${MONA_OLD_ID}`, { limit: 500 });
    
    if (mErr) {
        console.log(`Error: ${mErr.message}`);
    } else if (!monaFiles || monaFiles.length === 0) {
        console.log('Empty or not found');
    } else {
        console.log(`🎉 ${monaFiles.length} images found!`);
        monaFiles.forEach((f, i) => {
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(`products/${MONA_OLD_ID}/${f.name}`);
            console.log(`  [${i+1}] ${f.name}`);
            console.log(`       ${publicUrl}`);
        });
    }
    
    // Also check product_images/ subfolder (some products use different path)
    console.log(`\n--- product_images/ folder ---`);
    const { data: piFolder } = await supabase.storage
        .from(BUCKET)
        .list('product_images', { limit: 200 });
    
    if (piFolder && piFolder.length > 0) {
        console.log(`product_images/ entries: ${piFolder.length}`);
        piFolder.forEach(f => console.log(`  - ${f.name}`));
        
        // Check for Mona's files in product_images
        const monaOldFiles = piFolder.filter(f => f.name.startsWith(MONA_OLD_ID));
        console.log(`Mona OLD ID files in product_images/: ${monaOldFiles.length}`);
        monaOldFiles.forEach((f, i) => {
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(`product_images/${f.name}`);
            console.log(`  [${i+1}] ${f.name} → ${publicUrl}`);
        });
    } else {
        console.log('product_images/ folder not found or empty');
    }
}

run().catch(console.error);
