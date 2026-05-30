const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

// Mona's current auth user ID (the good one that still exists)
const MONA_PARTNER_ID = '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e';

async function run() {
    console.log('=== STEP 1: Login as Mona ===');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'modernfurniturecraft@gmail.com',
        password: '1234567'
    });

    if (authError) {
        console.error('Login failed:', authError.message);
        return;
    }
    console.log('Logged in as Mona. User ID:', authData.user.id);

    console.log('\n=== STEP 2: Fetch existing products ===');
    const { data: existingProducts, error: prodErr } = await supabase
        .from('products')
        .select('id')
        .eq('partner_id', MONA_PARTNER_ID);

    if (prodErr) {
        console.error('Error fetching products:', prodErr.message);
        return;
    }
    const existingIds = new Set(existingProducts.map(p => p.id));
    console.log('Existing Mona products in DB:', existingIds.size);

    console.log('\n=== STEP 3: Fetch all orders and extract Mona products ===');
    // We need all orders - but with anon key, only public orders may be visible.
    // However we confirmed earlier 36 orders are visible.
    const { data: orders, error: ordErr } = await supabase
        .from('orders')
        .select('*');

    if (ordErr) {
        console.error('Error fetching orders:', ordErr.message);
        return;
    }

    // Extract unique products from Mona's partner_id
    const productsMap = {};
    orders.forEach(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        items.forEach(item => {
            const pid = item.partner_id || item.partnerId;
            if (pid === '8a952bfb-d388-4e10-b7d6-ecc89d76a202' || pid === MONA_PARTNER_ID) {
                const prodId = item.product_id || item.id;
                if (prodId && !productsMap[prodId]) {
                    productsMap[prodId] = item;
                }
            }
        });
    });

    const monaOrderProducts = Object.entries(productsMap);
    console.log(`Found ${monaOrderProducts.length} unique Mona products in orders.`);

    console.log('\n=== STEP 4: Insert missing products back ===');
    let inserted = 0;
    let skipped = 0;

    for (const [productId, item] of monaOrderProducts) {
        if (existingIds.has(productId)) {
            console.log(`  [SKIP] Already exists: ${item.name?.substring(0, 50)}`);
            skipped++;
            continue;
        }

        const details = item.details || {};
        
        // Build the product row from the order item snapshot
        const productRow = {
            id: productId,  // Preserve original ID so order references still work
            partner_id: MONA_PARTNER_ID,
            name: item.name,
            price: item.price,
            mrp: item.mrp || item.price,
            category: item.category || null,
            image: item.image || null,
            images: item.images || null,
            description: details.description || null,
            warranty: details.warranty || null,
            care: details.care || null,
            brand: details.brand || null,
            specifications: details.specifications || [],
            showroom_name: details.showroom?.name || null,
            showroom_address: details.showroom?.address || null,
            showroom_phone: details.showroom?.phone || null,
            in_stock: true,
            stock: 10, // Default stock, restored product
            created_at: item.created_at || new Date().toISOString(),
        };

        const { error: insertErr } = await supabase
            .from('products')
            .insert(productRow);

        if (insertErr) {
            console.error(`  [ERROR] Could not insert ${item.name?.substring(0, 50)}:`, insertErr.message);
        } else {
            console.log(`  [OK] Restored: ${item.name?.substring(0, 60)}`);
            inserted++;
        }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Inserted: ${inserted} products`);
    console.log(`Skipped (already existed): ${skipped} products`);

    // Verify final count
    const { data: finalProducts } = await supabase
        .from('products')
        .select('id, name')
        .eq('partner_id', MONA_PARTNER_ID);
    
    console.log(`\nMona's products in DB now: ${finalProducts?.length || 0}`);
    finalProducts?.forEach((p, i) => {
        console.log(`  [${i+1}] ${p.name?.substring(0, 70)}`);
    });
}

run().catch(console.error);
