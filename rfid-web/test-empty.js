const https = require('https');

const options = {
  hostname: 'identificacion-rfid-estudiantes.vercel.app',
  port: 443,
  path: '/api/attendance',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
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

req.write('{}');
req.end();
