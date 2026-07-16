const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/attendance',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => body += d.toString());
  res.on('end', () => console.log('BODY:', body.substring(0, 500)));
});

req.on('error', (error) => {
  console.error(error);
});

req.write('{}');
req.end();
