async function run() {
  try {
    const key = "AIzaSyB7FV-3S_pAELSCQoy0HHu2YeQIqfjhdSY";
    console.log("Fetching products from Firestore REST API with API Key...");
    const url = `https://firestore.googleapis.com/v1/projects/badhee/databases/(default)/documents/products?pageSize=100&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`REST API error: ${res.status} ${res.statusText}`);
      const txt = await res.text();
      console.error(txt);
      return;
    }

    const data = await res.json();
    const documents = data.documents || [];
    console.log(`Total products fetched from Firestore: ${documents.length}`);

    const partnerGroups = {};
    const samples = [];

    documents.forEach(doc => {
      const fields = doc.fields || {};
      const pid = (fields.partnerId && fields.partnerId.stringValue) || 
                  (fields.partner_id && fields.partner_id.stringValue) || 
                  (fields.userId && fields.userId.stringValue) || 'null';
      partnerGroups[pid] = (partnerGroups[pid] || 0) + 1;
      
      const name = (fields.name && fields.name.stringValue) || 'No Name';
      samples.push({ name, partnerId: pid });
    });

    console.log("\nProducts count by partnerId in Firestore:", partnerGroups);
    console.log("\nSample products from Firestore (first 10):", samples.slice(0, 10));

    // Also fetch partners
    console.log("\nFetching partners from Firestore REST API...");
    const url2 = `https://firestore.googleapis.com/v1/projects/badhee/databases/(default)/documents/pre_approved_partners?pageSize=100&key=${key}`;
    const res2 = await fetch(url2);
    if (res2.ok) {
      const data2 = await res2.json();
      const docs2 = data2.documents || [];
      console.log(`Total partners in Firestore: ${docs2.length}`);
      docs2.forEach(doc => {
        const fields = doc.fields || {};
        const storeName = (fields.storeName && fields.storeName.stringValue) || 'No Store';
        const mobile = (fields.mobileNumber && fields.mobileNumber.stringValue) || 'No Mobile';
        console.log(`ID: ${doc.name.split('/').pop()} | StoreName: ${storeName} | Mobile: ${mobile}`);
      });
    }

  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

run();
