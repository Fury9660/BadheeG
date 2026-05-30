async function run() {
  const apiKey = "AIzaSyB7FV-3S_pAELSCQoy0HHu2YeQIqfjhdSY";
  const phoneNumber = "+918290617309"; // Mona's phone
  
  console.log(`Sending verification code to ${phoneNumber}...`);
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
