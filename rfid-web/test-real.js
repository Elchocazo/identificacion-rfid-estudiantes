const https = require('https');

const options = {
  hostname: 'identificacion-alumnos-rfid.vercel.app',
  port: 443,
  path: '/api/debug-db',
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => body += d.toString());
  res.on('end', () => console.log('BODY:', body.substring(0, 200)));
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
