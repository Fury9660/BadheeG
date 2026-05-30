const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Supabase anon key (try listing with different auth approaches)
const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const MONA_OLD_ID = '8a952bfb-d388-4e10-b7d6-ecc89d76a202';

// Login as Mona first, then try storage listing
async function run() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    
    // Login as Mona to get her session
    console.log('=== Mona ke session se storage list karo ===');
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'modernfurniturecraft@gmail.com',
        password: '1234567'
    });
    
    if (authErr) {
        console.error('Login failed:', authErr.message);
        return;
    }
    console.log('Logged in as Mona:', auth.user.id);
    
    // Now try storage listing with Mona's session
    const { data: files, error: storErr } = await supabase.storage
        .from('product-images')
        .list(`products/${MONA_OLD_ID}`, { limit: 1000 });
    
    if (storErr) {
        console.error('Storage list error:', storErr.message);
    } else {
        console.log(`\nFiles in products/${MONA_OLD_ID}/:`, files?.length || 0);
        if (files && files.length > 0) {
            console.log('\n🎉 FOUND FILES! Mona ke saare images:');
            files.forEach((f, i) => {
                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(`products/${MONA_OLD_ID}/${f.name}`);
                console.log(`[${i+1}] ${f.name}`);
                console.log(`     ${publicUrl}`);
            });
        }
    }
    
    // Also try the product_images path (some products use this)
    const { data: piFiles, error: piErr } = await supabase.storage
        .from('product-images')
        .list('product_images', { limit: 1000 });
    
    if (!piErr && piFiles && piFiles.length > 0) {
        const monaFiles = piFiles.filter(f => f.name.startsWith(MONA_OLD_ID));
        console.log(`\nFiles in product_images/ matching Mona OLD ID: ${monaFiles.length}`);
        monaFiles.forEach((f, i) => {
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(`product_images/${f.name}`);
            console.log(`[${i+1}] ${f.name} → ${publicUrl}`);
        });
        
        // Show ALL files in product_images for context
        console.log(`\nAll files in product_images/: ${piFiles.length}`);
        piFiles.slice(0, 20).forEach(f => console.log(`  - ${f.name}`));
    }
    
    // Also: get a raw HTTP listing using Mona's JWT
    console.log('\n=== Raw HTTP Storage API call with Mona JWT ===');
    const monaJWT = auth.session?.access_token;
    if (monaJWT) {
        const options = {
            hostname: 'esykxyhbawwdifubbdng.supabase.co',
            path: `/storage/v1/object/list/product-images`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${monaJWT}`,
                'Content-Type': 'application/json'
            }
        };
        
        const body = JSON.stringify({ prefix: `products/${MONA_OLD_ID}/`, limit: 1000 });
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Status:', res.statusCode);
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        console.log(`Files found: ${parsed.length}`);
                        parsed.forEach((f, i) => console.log(`  [${i+1}] ${f.name}`));
                    } else {
                        console.log('Response:', JSON.stringify(parsed).substring(0, 200));
                    }
                } catch(e) {
                    console.log('Raw response:', data.substring(0, 500));
                }
                process.exit(0);
            });
        });
        
        req.write(body);
        req.end();
    }
}

run().catch(console.error);
