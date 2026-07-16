const https = require('https');

const data = JSON.stringify({ uid: "7A 42 2F 35", schoolId: "CHMD" });

const options = {
  hostname: 'identificacion-rfid-estudiantes.vercel.app',
  port: 443,
  path: '/api/attendance',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
