const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// === FIREBASE ADMIN SETUP ===
const serviceAccount = require('../badhee-f0dec6964ef2.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'badhee'
    });
}

const db = admin.firestore();

// === SUPABASE SETUP ===
const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uZtB8nwMtFJY'
);

// Mona ki details
// Firebase mein Mona ka phone +918290617309 hai — uska Firebase UID dhundna hai
// Auth users mein dekha: koi Mona nahi mili (8290617309) — matlab Mona ka data
// Firestore ki `pre_approved_partners` collection mein check karo

async function run() {
    console.log('=== Firestore pre_approved_partners Collection ===\n');
    const partnersSnap = await db.collection('pre_approved_partners').get();
    partnersSnap.forEach(doc => {
        const d = doc.data();
        console.log(`Doc ID: ${doc.id}`);
        console.log(`  Owner: ${d.ownerName} | Mobile: ${d.mobileNumber} | Store: ${d.storeName}`);
        console.log(`  UID: ${d.uid || 'N/A'} | Status: ${d.status}`);
        console.log();
    });

    console.log('=== Checking ALL Firestore Collections more deeply ===\n');
    
    // Specifically search for Mona's phone in any collection
    const monaPhone = '8290617309';
    
    // Check users collection
    console.log('--- users collection ---');
    const usersSnap = await db.collection('users').get();
    usersSnap.forEach(doc => {
        const d = doc.data();
        console.log(`Doc ID: ${doc.id} | Name: ${d.name} | Phone: ${d.phoneNumber} | Email: ${d.email}`);
    });

    // Check orders collection - find Mona's orders
    console.log('\n--- orders collection sample ---');
    const ordersSnap = await db.collection('orders').get();
    console.log(`Total orders in Firebase: ${ordersSnap.size}`);
    ordersSnap.forEach(doc => {
        const d = doc.data();
        const items = d.items || [];
        items.forEach((item, idx) => {
            if (item.partnerId || item.partner_id) {
                console.log(`  Order ${doc.id}: Item partnerId: ${item.partnerId || item.partner_id} | Product: ${item.name?.substring(0, 50)}`);
            }
        });
    });

    // Print all Firebase Auth users again with more detail
    console.log('\n=== All Firebase Auth Users (checking for 8290617309) ===');
    const { users } = await admin.auth().listUsers(1000);
    const monaUser = users.find(u => 
        (u.phoneNumber && u.phoneNumber.includes('8290617309')) ||
        (u.email && u.email.includes('modernfurniturecraft'))
    );
    
    if (monaUser) {
        console.log('MONA FOUND in Firebase Auth!');
        console.log(`  UID: ${monaUser.uid}`);
        console.log(`  Phone: ${monaUser.phoneNumber}`);
        console.log(`  Email: ${monaUser.email}`);
        
        // Fetch Mona's products from Firestore
        console.log('\n=== Fetching Mona\'s products from Firestore ===');
        const monaProductsSnap = await db.collection('products')
            .where('partnerId', '==', monaUser.uid)
            .get();
        console.log(`Mona (${monaUser.uid}) ke products: ${monaProductsSnap.size}`);
    } else {
        console.log('Mona NOT found in Firebase Auth with phone 8290617309');
        console.log('\nAll users:');
        users.forEach(u => {
            console.log(`  UID: ${u.uid} | Phone: ${u.phoneNumber || 'N/A'} | Email: ${u.email || 'N/A'}`);
        });
    }

    process.exit(0);
}

run().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
