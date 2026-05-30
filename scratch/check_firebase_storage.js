const admin = require('firebase-admin');

// === FIREBASE ADMIN SETUP ===
const serviceAccount = require('../badhee-f0dec6964ef2.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'badhee',
        storageBucket: 'badhee.firebasestorage.app'
    });
}

// === CHECK SUPABASE via admin token ===
const https = require('https');

// Supabase project ref
const PROJECT_REF = 'esykxyhbawwdifubbdng';
const MONA_OLD_ID = '8a952bfb-d388-4e10-b7d6-ecc89d76a202';

// Try to get service_role JWT by decoding - won't work, but let's check management API
async function checkWithManagementAPI() {
    console.log('=== Trying Supabase Management API ===');
    // Check if there's a personal access token somewhere
}

// The real approach: Use Firebase Admin to check Firebase Storage
// (not Supabase storage - the products might be in Firebase Storage since the app used Firebase before)
async function checkFirebaseStorage() {
    console.log('=== Firebase Storage mein Mona ki images dhund rahe hain ===\n');
    
    const bucket = admin.storage().bucket();
    
    // List all files in product_images/ folder
    console.log('Firebase Storage bucket:', bucket.name);
    
    try {
        const [files] = await bucket.getFiles({ prefix: 'product_images/', maxResults: 1000 });
        console.log(`\nTotal files in product_images/: ${files.length}`);
        
        // Find Mona's files
        const monaFiles = files.filter(f => 
            f.name.includes(MONA_OLD_ID) || 
            f.name.includes('8290617309') ||
            f.name.includes('modernfurniturecraft')
        );
        
        console.log(`\nMona ke files: ${monaFiles.length}`);
        if (monaFiles.length > 0) {
            monaFiles.forEach((f, i) => {
                console.log(`  [${i+1}] ${f.name}`);
            });
        }
        
        // Also list ALL partners' files for context
        console.log('\n=== All partner folders in Firebase Storage ===');
        const partnerFolders = new Set();
        files.forEach(f => {
            const parts = f.name.split('/');
            if (parts.length > 1) {
                // Extract partner ID from filename like "product_images/PARTNERID_timestamp_0.jpg"
                const filename = parts[parts.length - 1];
                const partnerId = filename.split('_')[0];
                if (partnerId && partnerId.length > 10) {
                    partnerFolders.add(partnerId);
                }
            }
        });
        
        console.log('Unique partner IDs in Firebase Storage:');
        partnerFolders.forEach(id => {
            const count = files.filter(f => f.name.includes(id)).length;
            console.log(`  ${id}: ${count} files`);
        });

    } catch (err) {
        console.error('Firebase Storage error:', err.message);
    }
    
    process.exit(0);
}

checkFirebaseStorage().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
