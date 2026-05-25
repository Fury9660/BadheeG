const fetch = require('node-fetch');

async function test() {
    try {
        console.log("Testing Production Login with BADHEEG6537B2B...");
        const response = await fetch('https://ltl-clients-api.delhivery.com/ums/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'BADHEEG6537B2B',
                password: 'Yuvraj@302013'
            })
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
