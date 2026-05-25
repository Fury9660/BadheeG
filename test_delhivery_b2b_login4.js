const fetch = require('node-fetch');

async function test() {
    try {
        console.log("Testing Login with BADHEEG6537B2B...");
        const response1 = await fetch('https://btob.api.delhivery.com/ums/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'BADHEEG6537B2B',
                password: 'Yuvi@302013'
            })
        });
        const data1 = await response1.json();
        console.log("Result 1:", JSON.stringify(data1, null, 2));

        console.log("\nTesting Login with BADHEEG6537B2B...");
        const response2 = await fetch('https://btob.api.delhivery.com/ums/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'BADHEEG6537B2B',
                password: 'Yuvi@302013'
            })
        });
        const data2 = await response2.json();
        console.log("Result 2:", JSON.stringify(data2, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
