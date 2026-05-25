const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

async function testQueryByUid() {
  try {
    const userId = '06358bd1-2f57-4fe3-b88c-d04c2a2c19ec';
    const url = `${supabaseUrl}/rest/v1/pre_approved_partners?user_id=eq.${userId}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      const status = data[0].status;
      console.log("Status:", JSON.stringify(status));
      console.log("Length:", status.length);
      console.log("Char codes:", [...status].map(c => c.charCodeAt(0)));
    } else {
      console.log("No data found");
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testQueryByUid();
