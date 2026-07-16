const https = require('https');

const options = {
  hostname: 'identificacion-rfid-estudiantes.vercel.app',
  port: 443,
  path: '/api/debug-db',
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
