async function run() {
  const apiKey = "AIzaSyB7FV-3S_pAELSCQoy0HHu2YeQIqfjhdSY";
  try {
    console.log("Attempting Firebase Anonymous Sign-In via REST API...");
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    const authRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    });

    if (!authRes.ok) {
      console.error(`Firebase Auth error: ${authRes.status} ${authRes.statusText}`);
      const txt = await authRes.text();
      console.error(txt);
      return;
    }

    const authData = await authRes.json();
    const idToken = authData.idToken;
    console.log("Successfully authenticated to Firebase. ID Token obtained.");

    console.log("\nFetching products from Firestore REST API using auth token...");
    // We pass the token in Authorization header
    const url = `https://firestore.googleapis.com/v1/projects/badhee/databases/(default)/documents/products?pageSize=300`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!res.ok) {
      console.error(`Firestore REST API error: ${res.status} ${res.statusText}`);
      const txt = await res.text();
      console.error(txt);
      return;
    }

    const data = await res.json();
    const documents = data.documents || [];
    console.log(`Successfully fetched ${documents.length} products from Firestore!`);

    // Let's print the first 5 products to see their structure
    console.log("\nSample Firestore Products:");
    documents.slice(0, 5).forEach(doc => {
      console.log(JSON.stringify(doc, null, 2));
    });

  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

run();
