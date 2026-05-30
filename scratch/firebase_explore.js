const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

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

async function run() {
    // Sabse pehle ALL collections list karo
    console.log('=== Firebase Collections List ===\n');
    
    const collections = await db.listCollections();
    for (const col of collections) {
        const snap = await db.collection(col.id).get();
        console.log(`Collection: "${col.id}" — ${snap.size} documents`);
        
        // Sample first document fields
        if (snap.size > 0) {
            const firstDoc = snap.docs[0];
            const data = firstDoc.data();
            console.log(`  Fields: ${Object.keys(data).join(', ')}`);
            if (data.partnerId || data.partner_id) {
                const pid = data.partnerId || data.partner_id;
                console.log(`  Sample partnerId: ${pid}`);
            }
        }
    }

    console.log('\n=== Firebase Auth Users ===');
    // Auth users list karo to identify Mona
    const listResult = await admin.auth().listUsers();
    console.log(`Total Firebase Auth users: ${listResult.users.length}`);
    listResult.users.forEach(user => {
        const phone = user.phoneNumber || 'N/A';
        const email = user.email || 'N/A';
        const uid = user.uid;
        console.log(`UID: ${uid} | Phone: ${phone} | Email: ${email}`);
    });
    
    process.exit(0);
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
