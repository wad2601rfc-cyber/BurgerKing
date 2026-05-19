const https = require('https');

https.get('https://burger-king-7f70f-default-rtdb.asia-southeast1.firebasedatabase.app/orders.json', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    console.log("Firebase Orders:");
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
