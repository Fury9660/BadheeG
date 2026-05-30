const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// ============================================================
// SERVICE ROLE KEY paste karo yahan:
// Supabase Dashboard → Settings → API → "service_role" (secret)
// ============================================================
const SERVICE_ROLE_KEY = 'PASTE_SERVICE_ROLE_KEY_HERE';

const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const MONA_OLD_ID = '8a952bfb-d388-4e10-b7d6-ecc89d76a202';
const MONA_NEW_ID = '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e';

async function run() {
    if (SERVICE_ROLE_KEY === 'PASTE_SERVICE_ROLE_KEY_HERE') {
        console.error('❌ Service role key paste karo script mein!');
        console.log('\nKahan milegi:');
        console.log('1. https://supabase.com/dashboard/project/esykxyhbawwdifubbdng/settings/api');
        console.log('2. "Project API Keys" section mein');
        console.log('3. "service_role" → "Reveal" click karo');
        console.log('4. Us key ko yahan paste karo aur script dobara chalao');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    console.log('=== service_role se Mona ka PURA storage list kar rahe hain ===\n');
    
    // List ALL files in products/ folder
    const { data: allFiles, error } = await supabase.storage
        .from('product-images')
        .list('products', { limit: 1000 });
    
    if (error) {
        console.error('Error:', error.message);
        return;
    }
    
    console.log(`Total folders/files in products/: ${allFiles?.length || 0}`);
    
    // Now list specifically Mona's OLD ID folder
    const { data: monaFiles, error: mErr } = await supabase.storage
        .from('product-images')
        .list(`products/${MONA_OLD_ID}`, { limit: 500 });
    
    if (mErr) {
        console.error('Mona folder error:', mErr.message);
    } else {
        console.log(`\nMona ke images (OLD ID folder): ${monaFiles?.length || 0}`);
        
        if (monaFiles && monaFiles.length > 0) {
            console.log('\n🎉 IMAGES FOUND! Saari files:');
            const imageUrls = [];
            monaFiles.forEach((f, i) => {
                const path = `products/${MONA_OLD_ID}/${f.name}`;
                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(path);
                console.log(`[${i+1}] ${f.name}`);
                console.log(`     URL: ${publicUrl}`);
                imageUrls.push({ filename: f.name, url: publicUrl });
            });
            
            // Save URLs to file for reference
            const fs = require('fs');
            fs.writeFileSync(
                __dirname + '/mona_recovered_images.json',
                JSON.stringify(imageUrls, null, 2)
            );
            console.log(`\n✅ Saved ${imageUrls.length} image URLs to mona_recovered_images.json`);
        }
    }
    
    process.exit(0);
}

run().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
