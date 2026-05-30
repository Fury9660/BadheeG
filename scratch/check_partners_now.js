const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

const phones = ['+918290617309', '+919413010506', '+918824536948'];

// Try multiple formats since mobile_number can be stored differently
const allVariants = phones.flatMap(p => [
    p,                          // +918290617309
    p.replace('+91', ''),       // 8290617309
    p.replace('+91', '91'),     // 918290617309
    '0' + p.replace('+91', ''), // 08290617309
]);

async function check() {
    console.log('\n=== CHECKING ALL PARTNERS IN DB ===');
    const { data: all, error: allErr } = await supabase
        .from('pre_approved_partners')
        .select('id, owner_name, store_name, mobile_number, email, status, is_verified, city, created_at')
        .order('created_at', { ascending: false });

    if (allErr) {
        console.error('Error fetching all partners:', allErr.message);
    } else {
        console.log(`Total partners in DB: ${all.length}`);
        console.log('\n--- All Partners ---');
        all.forEach((p, i) => {
            console.log(`\n[${i+1}] ${p.owner_name || 'N/A'} | Store: ${p.store_name || 'N/A'}`);
            console.log(`    Mobile: ${p.mobile_number || 'N/A'} | Email: ${p.email || 'N/A'}`);
            console.log(`    Status: ${p.status} | Verified: ${p.is_verified} | City: ${p.city || 'N/A'}`);
        });
    }

    console.log('\n=== SEARCHING FOR YOUR 3 SPECIFIC NUMBERS ===');
    for (const phone of phones) {
        const bare = phone.replace('+91', '');
        const { data, error } = await supabase
            .from('pre_approved_partners')
            .select('id, owner_name, store_name, mobile_number, email, status, is_verified, city, created_at')
            .or(`mobile_number.eq.${phone},mobile_number.eq.${bare},mobile_number.ilike.%${bare}%`);

        if (error) {
            console.log(`\n${phone}: ERROR - ${error.message}`);
        } else if (!data || data.length === 0) {
            console.log(`\n${phone}: ❌ NOT FOUND in database`);
        } else {
            data.forEach(p => {
                console.log(`\n${phone}: ✅ FOUND`);
                console.log(`  ID:       ${p.id}`);
                console.log(`  Name:     ${p.owner_name}`);
                console.log(`  Store:    ${p.store_name}`);
                console.log(`  Mobile:   ${p.mobile_number}`);
                console.log(`  Email:    ${p.email}`);
                console.log(`  Status:   ${p.status}`);
                console.log(`  Verified: ${p.is_verified}`);
                console.log(`  City:     ${p.city}`);
                console.log(`  Joined:   ${new Date(p.created_at).toLocaleString('en-IN')}`);
            });
        }
    }
}

check().catch(console.error);
