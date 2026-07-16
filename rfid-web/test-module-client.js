const https = require('https');

const options = {
  hostname: 'identificacion-rfid-estudiantes.vercel.app',
  port: 443,
  path: '/api/test-module',
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => body += d.toString());
  res.on('end', () => console.log('BODY:', body));
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
