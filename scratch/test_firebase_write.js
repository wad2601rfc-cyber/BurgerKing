const https = require('https');

const DB_URL = 'burger-king-7f70f-default-rtdb.asia-southeast1.firebasedatabase.app';

// Test 1: Check Firebase rules by reading
console.log("=== Test 1: Read orders ===");
https.get(`https://${DB_URL}/orders.json`, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const orders = JSON.parse(data);
    const keys = orders ? Object.keys(orders) : [];
    console.log(`Found ${keys.length} orders.`);

    if (keys.length > 0) {
      const lastKey = keys[keys.length - 1];
      console.log(`\n=== Test 2: Try PATCH write to update last order (${lastKey}) ===`);

      const payload = JSON.stringify({ rating: 5, feedback: "Test feedback from Node.js!" });
      const options = {
        hostname: DB_URL,
        path: `/orders/${lastKey}.json`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let resData = '';
        res.on('data', (chunk) => { resData += chunk; });
        res.on('end', () => {
          console.log(`HTTP Status: ${res.statusCode}`);
          console.log(`Response: ${resData}`);
          if (res.statusCode === 200) {
            console.log("\n✅ Firebase WRITE works! Rules allow updates.");
          } else {
            console.log("\n❌ Firebase WRITE failed. Check Security Rules.");
            console.log("Rules must allow: orders/{id} -> write: true");
          }
        });
      });

      req.on('error', (e) => console.error("Request error:", e.message));
      req.write(payload);
      req.end();
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
