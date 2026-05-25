
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

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

async function checkData() {
    console.log("Checking Products...");
    const q = query(collection(db, "products"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
        console.log("No products found.");
    } else {
        console.log("First Product Data:", snap.docs[0].data());
    }

    console.log("\nChecking Pre-Approved Partners...");
    const q2 = query(collection(db, "pre_approved_partners"), limit(5));
    const snap2 = await getDocs(q2);
    snap2.forEach(doc => {
        console.log(`Partner ID: ${doc.id} | StoreName: ${doc.data().storeName}`);
    });
}

checkData().catch(console.error);
