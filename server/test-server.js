// Quick test script to verify server routes
const http = require('http');

const testRoutes = [
  'http://localhost:5000/health',
  'http://localhost:5000/api',
  'http://localhost:5000/api/import-history',
  'http://localhost:5000/api/import-history/stats/summary',
];

console.log('Testing server routes...\n');

testRoutes.forEach((url) => {
  http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`✅ ${url} - Status: ${res.statusCode}`);
      if (res.statusCode !== 200) {
        console.log(`   Response: ${data.substring(0, 100)}`);
      }
    });
  }).on('error', (err) => {
    console.log(`❌ ${url} - Error: ${err.message}`);
  });
});

