fetch('http://localhost:3000/api/test-auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ uid: 'test', password: 'newpassword123' })
}).then(r => r.json()).then(console.log).catch(console.error);
