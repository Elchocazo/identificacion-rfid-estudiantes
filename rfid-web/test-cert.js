const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function test() {
  try {
    initializeApp({
      credential: cert({
        projectId: 'identificacion-alumnos-rfid',
        clientEmail: 'invalid-email@identificacion-alumnos-rfid.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDC1iPiczeXbnzQ\nGCaISklt3YUq2fpRPH2/axklNlLE9H/sRxgmZ0cmAcafVTHM7lgIkx3Hinc8Sqdb\n9H1Ip7GuQR8Y7AK4FhlsW2zCqpjAFfYaEdWGzKAKjs3uymQO7v7eR3VgGf23vmXp\nSVELWItOnhkDkbAgON6EXQaukP8+ldQSaRFUaApq7Dr/6AytsyDcP+H0AyzSDRFx\nxfVtxXb3+gypMzWlUh4prorMN0YhUZZgYyPhwTfcQ2pFUvf354PUYl4wJlO315Zn\nvYJDr0agip4ZSwFl2GcWUUIbPMbqjDotoeCKn1mR5v2w5XANGLyT5d5zBOAXV8PZ\ntFtmT/upAgMBAAECggEAXUhshuOWFq0iGfmuHSvAC1d3hiQ2CkX1iLvMnrnrF/xd\n8PC6+cwRzvsjry55eP4WbQiOxfYgD2BIz6h3gV00n1LzghmhVaTTCEOfh3ZpSvJY\n0XN/cZov984Wf8Er9dBse1zoMBpRlPMWVQKyyEVc8UeVf1V153+C3gmyBMtMQZhh\nDjXFT9ROQyFACZCZEL6/5N2YHditG4g3lI3ON0GJFw93+qo1c8y/F6kJEXeXEAyL\nmfTosMvaUfuINZf6n2ac6zCzwXuDMZVmCelfHtaM1UMVmfK7RyvYACxefXKeLYD0\nx8AhG0nykP225/jQgMjgjuh+xskQiWM9oRmJOKnXRwKBgQDyWL0kGISkUxNabWc9\n83qhzgya1CRjtn1JInvSyH9CJFMmM4yuqvnfsBktSopOve160GMJYp82sZwKKC6/\n9UuAtm0Nae3aa7BMRHXiTee/UJKY4S8BDIcfbEvIFPjJBfwzP9cY4pRbaJNQe+r4\nrB+Dr7kG17WeoL4v1VKW7aNqqwKBgQDN0C7SIT/Ga2V4i87Nwwu8ieDZupgBSnrR\nVtZbX2SP5cnNiaZpfgQ8EQ00AdoQ0vrlTxFaun2+hxCOVg0q96mfVFS9gg5zcFDz\neTMtyQxBk8r6LRSFpZBSJvHxnBqDCJPHGwYZ+wRaNe/hS4pXYjPPrJoGUS0/YQ34\nYgB0TMMy+wKBgD2x8ZS62SmsLIUczOeske+Y0QSpdQodbw+rQ7KJcDw6WyCihvIA\nfNRBVGd/Tm51U3us8zD0dmvKE1tSl3Qu0iXWSzTa/r5YI+2GkCwogRLnRCq/SOQP\neGA7fX5xKI0g/s9dNtkU1YGBS4b5Sxw7VVqE5amkSIw1h7vNrVTW8n85AoGAMMoq\n1E7cdX7sw+scTNRx63IfvHbhnSywfPk+QngRU6b2caSztSSdclXEIN/z2iqGbrq\nOb0GHiaSXaczp0aXAhFRiRw2BtQN2iJVZfVe06TY6v3TZvcbgtuHZ9+8yF835G0c\nRz+agGVX0OJVH08/p20V8Xk6Z1HvpXJS+VP7DBECgYB8u/kEWPca/kWXtq4qe5Kn\nIhIueahry/EKMAk6yCImpnZjThHa3+gymVBuOQ5Sa4JAu9gOGb+gwqjfMgcrffoF\naevFVpD0zj3XEZtS/Ha/p7tABdauzaHpYxKrf14SMeF2Ed+/cibc2StcBUL3jAQE\ni7VFp+rkoQOT8j5wb/swAA==\n-----END PRIVATE KEY-----\n'
      })
    });
    console.log("Success");
  } catch(e) {
    console.error("Caught:", e.message);
  }
}
test();
