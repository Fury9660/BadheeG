const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyB7FV-3S_pAELSCQoy0HHu2YeQIqfjhdSY",
    authDomain: "badhee.firebaseapp.com",
    projectId: "badhee",
    storageBucket: "badhee.firebasestorage.app",
    messagingSenderId: "485011559568",
    appId: "1:485011559568:web:a1a451e5a54c33bcba7415"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    console.log("Fetching all products from Firestore...");
    const snap = await getDocs(collection(db, "products"));
    console.log(`Total products in Firestore: ${snap.size}`);

    const partnerGroups = {};
    const sampleProducts = [];
    
    snap.forEach(doc => {
      const p = doc.data();
      const pid = p.partnerId || p.partner_id || p.userId || 'null';
      partnerGroups[pid] = (partnerGroups[pid] || 0) + 1;
      
      sampleProducts.push({
        id: doc.id,
        name: p.name,
        partnerId: pid
      });
    });

    console.log("\nProducts count by partnerId in Firestore:", partnerGroups);
    console.log("\nSample products from Firestore (first 10):", sampleProducts.slice(0, 10));

    // Also let's query pre_approved_partners in Firestore to compare
    const snap2 = await getDocs(collection(db, "pre_approved_partners"));
    console.log(`\nTotal partners in Firestore: ${snap2.size}`);
    snap2.forEach(doc => {
      console.log(`Firestore Partner ID: ${doc.id} | StoreName: ${doc.data().storeName} | Mobile: ${doc.data().mobileNumber}`);
    });

  } catch (e) {
    console.error("Error:", e);
  }
}

run();
