const { GoogleAuth } = require('google-auth-library');
require('dotenv').config({ path: '.env.local' });

async function changePassword() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/identitytoolkit'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const localId = 'test_user_id'; 
  
  console.log("Token:", token.token ? "Success" : "Failed");
  
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      localId: localId,
      password: "newpassword123"
    })
  });
  
  const data = await res.json();
  console.log("Response:", data);
}

changePassword().catch(console.error);
