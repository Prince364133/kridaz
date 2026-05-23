import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 6001,
  path: '/api/scoring/update',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({
  scoringId: "nonexistent", // just to see what the server returns
  ballData: { runs: 6 }
}));
req.end();
