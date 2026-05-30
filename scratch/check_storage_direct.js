const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

const MONA_OLD_ID = '8a952bfb-d388-4e10-b7d6-ecc89d76a202';
const MONA_NEW_ID = '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e';

async function run() {
    // Try specific bucket names directly
    const bucketNames = ['product-images', 'products', 'images', 'public', 'assets'];
    
    for (const bucketName of bucketNames) {
        // Try listing root
        const { data: root, error: rootErr } = await supabase.storage
            .from(bucketName)
            .list('', { limit: 10 });
        
        if (!rootErr && root) {
            console.log(`\n=== Bucket: ${bucketName} ===`);
            console.log('Root folders:', root.map(f => f.name));
            
            // Check products/MONA_OLD_ID
            const { data: monaOld } = await supabase.storage
                .from(bucketName)
                .list(`products/${MONA_OLD_ID}`, { limit: 200 });
            
            if (monaOld && monaOld.length > 0) {
                console.log(`\n🎉 Mona OLD ID images: ${monaOld.length} files!`);
                monaOld.slice(0, 10).forEach((f, i) => {
                    const { data: { publicUrl } } = supabase.storage
                        .from(bucketName)
                        .getPublicUrl(`products/${MONA_OLD_ID}/${f.name}`);
                    console.log(`  [${i+1}] ${f.name} → ${publicUrl}`);
                });
            }
            
            // Check products/MONA_NEW_ID
            const { data: monaNew } = await supabase.storage
                .from(bucketName)
                .list(`products/${MONA_NEW_ID}`, { limit: 200 });
            
            if (monaNew && monaNew.length > 0) {
                console.log(`\n✅ Mona NEW ID images: ${monaNew.length} files!`);
                monaNew.slice(0, 10).forEach((f, i) => {
                    const { data: { publicUrl } } = supabase.storage
                        .from(bucketName)
                        .getPublicUrl(`products/${MONA_NEW_ID}/${f.name}`);
                    console.log(`  [${i+1}] ${f.name} → ${publicUrl}`);
                });
            }
        }
    }

    // Also check what image URLs the existing Mona products have
    console.log('\n=== Existing Mona products ki image URLs ===');
    const { data: monaProds } = await supabase
        .from('products')
        .select('id, name, image, images, partner_id')
        .eq('partner_id', MONA_NEW_ID);
    
    monaProds?.forEach((p, i) => {
        console.log(`[${i+1}] ${p.name?.substring(0, 50)}`);
        console.log(`     image: ${p.image}`);
    });
}

run().catch(console.error);
