const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc4MjM3NywiZXhwIjoyMDg1MzU4Mzc3fQ.7jXhyS5odq4LTDKnWcodlCfVo8xx3Q0PwcTOKKmXgaI';
const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const MONA_OLD_ID = '8a952bfb-d388-4e10-b7d6-ecc89d76a202';
const MONA_NEW_ID = '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e';
const BUCKET = 'product-images';
const TIME_GAP = 15000; // 15 seconds gap = new product

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

// Known products from orders (already restored)
const KNOWN_PRODUCTS = {
    '1776338279077': { name: "Sheesham Wood End Table for Living Room | Carved Scalloped Top Accent", price: 12999, mrp: 26000, category: "Furniture" },
    '1776338496160': { name: "Live-Edge Solid Wood Console Table with Industrial Metal Legs - Light", price: 14999, mrp: 30000, category: "Furniture" },
    '1776434906593': { name: "Premium Sheesham Wood Oval Multi-Purpose Console & TV Unit – Bobbin-Style", price: 18999, mrp: 38000, category: "Furniture" },
    '1776434807233': { name: "Wood 'Live-Edge' Coffee Table – Natural Finish with Hand-Crafted Legs", price: 11999, mrp: 24000, category: "Furniture" },
};
// Also product_images path product (old upload)
const OLD_PATH_PRODUCT = '1770808742147'; // Solid Sheesham Wood Designer Table

async function run() {
    console.log('=== STEP 1: Saari images fetch kar rahe hain ===\n');
    
    const { data: files, error } = await supabase.storage
        .from(BUCKET)
        .list(`products/${MONA_OLD_ID}`, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
    
    if (error) {
        console.error('Storage error:', error.message);
        return;
    }
    
    console.log(`Total images found: ${files.length}`);
    
    // Also check product_images path
    const { data: piFiles } = await supabase.storage
        .from(BUCKET)
        .list('product_images', { limit: 500 });
    
    const monaOldPathFiles = (piFiles || []).filter(f => f.name.startsWith(MONA_OLD_ID));
    console.log(`Old path (product_images/) Mona files: ${monaOldPathFiles.length}`);
    
    // Save full list
    const allFiles = [...files];
    
    // === STEP 2: Group by timestamp proximity ===
    console.log('\n=== STEP 2: Products mein group kar rahe hain ===\n');
    
    const sortedFiles = files.map(f => {
        const ts = parseInt(f.name.split('-')[0]);
        return { name: f.name, ts, url: supabase.storage.from(BUCKET).getPublicUrl(`products/${MONA_OLD_ID}/${f.name}`).data.publicUrl };
    }).sort((a, b) => a.ts - b.ts);
    
    // Group by time proximity
    const productGroups = [];
    let currentGroup = [];
    let lastTs = 0;
    
    sortedFiles.forEach(file => {
        if (lastTs === 0 || (file.ts - lastTs) <= TIME_GAP) {
            currentGroup.push(file);
        } else {
            if (currentGroup.length > 0) productGroups.push([...currentGroup]);
            currentGroup = [file];
        }
        lastTs = file.ts;
    });
    if (currentGroup.length > 0) productGroups.push(currentGroup);
    
    console.log(`Identified ${productGroups.length} product groups from ${files.length} images\n`);
    
    // Add old-path product
    if (monaOldPathFiles.length > 0) {
        const oldPathGroup = monaOldPathFiles.map(f => ({
            name: f.name,
            ts: parseInt(f.name.split('_')[1] || '0'),
            url: supabase.storage.from(BUCKET).getPublicUrl(`product_images/${f.name}`).data.publicUrl,
            oldPath: true
        }));
        productGroups.push(oldPathGroup);
        console.log(`Added ${oldPathGroup.length} images from old path as additional product`);
    }
    
    // Save groups to JSON
    fs.writeFileSync(__dirname + '/mona_product_groups.json', JSON.stringify(productGroups, null, 2));
    console.log(`Saved product groups to mona_product_groups.json`);
    
    // === STEP 3: Show product groups ===
    productGroups.forEach((group, i) => {
        const firstTs = group[0].ts.toString();
        const isKnown = Object.keys(KNOWN_PRODUCTS).some(k => firstTs.startsWith(k.substring(0, 10)));
        const knownName = isKnown ? '(ALREADY RESTORED)' : '(NEW - TO RESTORE)';
        console.log(`\n[Product ${i+1}] ${knownName} — ${group.length} images`);
        console.log(`  First image: ${group[0].url}`);
        if (group.length > 1) console.log(`  All images: ${group.map(f => f.url).join('\n             ')}`);
    });
    
    // === STEP 4: Get existing Mona products ===
    console.log('\n=== STEP 3: Existing Mona products check ===');
    const { data: existing } = await supabase.from('products').select('id, name, image, partner_id').eq('partner_id', MONA_NEW_ID);
    console.log(`Existing: ${existing?.length || 0}`);
    const existingImages = new Set(existing?.map(p => p.image) || []);
    
    // === STEP 5: Insert NEW products ===
    console.log('\n=== STEP 4: Naye products insert kar rahe hain ===\n');
    let inserted = 0;
    let skipped = 0;
    
    for (let i = 0; i < productGroups.length; i++) {
        const group = productGroups[i];
        const firstImg = group[0].url;
        const allImgUrls = group.map(g => g.url);
        
        // Skip if this image is already in an existing product
        if (existingImages.has(firstImg)) {
            console.log(`[SKIP] Product ${i+1}: Already exists`);
            skipped++;
            continue;
        }
        
        // Check if it's a known product by timestamp
        const firstTs = group[0].ts.toString();
        let knownData = null;
        for (const [ts, data] of Object.entries(KNOWN_PRODUCTS)) {
            if (Math.abs(parseInt(firstTs) - parseInt(ts)) < 5000) {
                knownData = data;
                break;
            }
        }
        
        if (knownData) {
            console.log(`[SKIP] Product ${i+1}: Known product "${knownData.name.substring(0, 50)}" already restored`);
            skipped++;
            continue;
        }
        
        // Insert as placeholder product — Mona can edit later
        const productRow = {
            partner_id: MONA_NEW_ID,
            name: `Modern Furniture Craft — Product ${i + 1}`,  // Placeholder name
            price: 1,           // Placeholder — Mona to update
            mrp: 1,
            stock: 0,
            category: 'Furniture',
            image: firstImg,
            images: allImgUrls,
            description: 'Product details to be updated by the store owner.',
            showroom_name: 'Modern furniture craft',
            showroom_phone: '8290617309',
            in_stock: false,    // Keep out of stock until Mona reviews
            created_at: new Date(group[0].ts).toISOString(),
        };
        
        const { error: insErr } = await supabase.from('products').insert(productRow);
        
        if (insErr) {
            console.error(`[ERROR] Product ${i+1}: ${insErr.message}`);
        } else {
            console.log(`[OK] Inserted Product ${i+1} — ${group.length} images — ${firstImg.split('/').pop()}`);
            inserted++;
        }
    }
    
    // === Final count ===
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('partner_id', MONA_NEW_ID);
    
    console.log('\n=== RESULT ===');
    console.log(`Inserted: ${inserted} new products`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Mona ke TOTAL products Supabase mein ab: ${count}`);
    
    const { data: allMona } = await supabase.from('products').select('id, name, in_stock').eq('partner_id', MONA_NEW_ID);
    allMona?.forEach((p, i) => console.log(`  [${i+1}] ${p.in_stock ? '✅' : '⚠️ '} ${p.name?.substring(0, 70)}`));
    
    process.exit(0);
}

run().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
