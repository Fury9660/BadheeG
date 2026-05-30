const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// === FIREBASE ADMIN SETUP ===
const serviceAccount = require('../badhee-f0dec6964ef2.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'badhee'
});

const db = admin.firestore();

// === SUPABASE SETUP ===
const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

// Mona ka CURRENT Supabase user ID (jo abhi bhi exists karta hai)
const MONA_NEW_PARTNER_ID = '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e';
// Mona ka PURANA ID (jo delete ho gaya tha - cascade se products bhi gaye)
const MONA_OLD_PARTNER_ID = '8a952bfb-d388-4e10-b7d6-ecc89d76a202';

async function run() {
    console.log('=== STEP 1: Firestore se saare products fetch kar rahe hain ===\n');
    
    const snap = await db.collection('products').get();
    console.log(`Firestore mein total products: ${snap.size}`);
    
    if (snap.size === 0) {
        console.log('Firestore mein koi products nahi mila!');
        return;
    }

    // Saare products save karo as backup
    const allFirestoreProducts = [];
    snap.forEach(doc => {
        allFirestoreProducts.push({ firestoreId: doc.id, ...doc.data() });
    });

    // Backup file save karo
    const backupPath = path.join(__dirname, 'firestore_all_products_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(allFirestoreProducts, null, 2));
    console.log(`Backup saved: ${backupPath}`);

    // Partner ke hisab se group karo
    const partnerGroups = {};
    allFirestoreProducts.forEach(p => {
        const pid = p.partnerId || p.partner_id || p.userId || p.sellerId || 'unknown';
        partnerGroups[pid] = (partnerGroups[pid] || 0) + 1;
    });
    console.log('\nFirestore products by partnerId:', partnerGroups);

    // =================================================================
    // STEP 2: Existing Supabase products check karo
    // =================================================================
    console.log('\n=== STEP 2: Supabase mein existing products check ===');
    const { data: existingProducts, error: epErr } = await supabase
        .from('products')
        .select('id, name, partner_id');

    if (epErr) {
        console.error('Supabase error:', epErr.message);
        return;
    }
    console.log(`Supabase mein existing products: ${existingProducts.length}`);
    const existingIds = new Set(existingProducts.map(p => p.id));

    // =================================================================
    // STEP 3: Mona ke Firestore products filter karo aur insert karo
    // =================================================================
    console.log('\n=== STEP 3: Mona ke products filter aur restore ===');
    
    const monaFirestoreProducts = allFirestoreProducts.filter(p => {
        const pid = p.partnerId || p.partner_id || p.userId || '';
        return pid === MONA_OLD_PARTNER_ID || pid === MONA_NEW_PARTNER_ID;
    });

    console.log(`Mona ke products Firestore mein: ${monaFirestoreProducts.length}`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const fp of monaFirestoreProducts) {
        // Check if already in Supabase (by name match or ID)
        const alreadyExists = existingIds.has(fp.firestoreId) || 
            existingProducts.some(ep => ep.name === fp.name && ep.partner_id === MONA_NEW_PARTNER_ID);
        
        if (alreadyExists) {
            console.log(`  [SKIP] Already exists: ${fp.name?.substring(0, 60)}`);
            skipped++;
            continue;
        }

        // Supabase schema mein map karo
        const productRow = {
            // ID preserve karo agar possible ho, warna naya generate hoga
            partner_id: MONA_NEW_PARTNER_ID,
            name: fp.name || fp.productName || 'Unknown Product',
            price: parseFloat(fp.price || fp.sellingPrice || 0),
            mrp: parseFloat(fp.mrp || fp.originalPrice || fp.price || 0),
            stock: parseInt(fp.stock || fp.quantity || 10),
            category: fp.category || fp.categoryName || null,
            image: fp.image || fp.imageUrl || fp.thumbnail || (fp.images && fp.images[0]) || null,
            images: fp.images || (fp.image ? [fp.image] : null),
            description: fp.description || fp.productDescription || null,
            warranty: fp.warranty || null,
            care: fp.care || fp.careInstructions || null,
            brand: fp.brand || fp.brandName || null,
            specifications: fp.specifications || fp.specs || [],
            showroom_name: fp.showroomName || fp.storeName || 'Modern furniture craft',
            showroom_address: fp.showroomAddress || fp.storeAddress || null,
            showroom_phone: fp.showroomPhone || fp.storePhone || '8290617309',
            in_stock: fp.inStock !== false && fp.in_stock !== false,
            created_at: fp.createdAt ? new Date(fp.createdAt._seconds * 1000).toISOString() 
                       : new Date().toISOString(),
        };

        const { error: insertErr } = await supabase
            .from('products')
            .insert(productRow);

        if (insertErr) {
            console.error(`  [ERROR] ${fp.name?.substring(0, 50)}: ${insertErr.message}`);
            errors++;
        } else {
            console.log(`  [OK] Inserted: ${fp.name?.substring(0, 70)}`);
            inserted++;
        }
    }

    // =================================================================
    // STEP 4: Final Summary
    // =================================================================
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Firestore mein total products: ${snap.size}`);
    console.log(`Mona ke Firestore products: ${monaFirestoreProducts.length}`);
    console.log(`Successfully inserted: ${inserted}`);
    console.log(`Already existed (skipped): ${skipped}`);
    console.log(`Errors: ${errors}`);

    // Verify final count in Supabase
    const { data: finalProds } = await supabase
        .from('products')
        .select('id, name')
        .eq('partner_id', MONA_NEW_PARTNER_ID);
    
    console.log(`\nMona ke total products Supabase mein ab: ${finalProds?.length || 0}`);
    finalProds?.forEach((p, i) => {
        console.log(`  [${i+1}] ${p.name?.substring(0, 70)}`);
    });

    // Overall products count
    const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
    console.log(`\nSuabase mein TOTAL products ab: ${count}`);

    process.exit(0);
}

run().catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
});
