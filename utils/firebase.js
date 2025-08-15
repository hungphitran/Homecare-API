// Firebase Admin initialization
// Expect one of:
// - GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account JSON
// - Or FIREBASE_SERVICE_ACCOUNT (base64 JSON) env var

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let initialized = false;

function initFirebase() {
  if (initialized) return admin;

  // Try GOOGLE_APPLICATION_CREDENTIALS path
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  console.log('Initializing Firebase Admin SDK...');
    console.log('Using GOOGLE_APPLICATION_CREDENTIALS:', credsPath);
    console.log('Using FIREBASE_SERVICE_ACCOUNT:', !!b64);

  try {
    if (credsPath && fs.existsSync(credsPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(require(credsPath))
      });
      initialized = true;
      return admin;
    }

    // Try loading service_account.json from current directory as fallback
    const localServiceAccountPath = path.join(__dirname, '..', 'service_account.json');
    if (fs.existsSync(localServiceAccountPath)) {
      console.log('Using local service_account.json file');
      admin.initializeApp({
        credential: admin.credential.cert(require(localServiceAccountPath))
      });
      initialized = true;
      return admin;
    }

    if (b64) {
      try {
        // First attempt: treat as base64 of JSON
        const decoded = Buffer.from(b64, 'base64').toString('utf8');
        const json = JSON.parse(decoded);
        admin.initializeApp({
          credential: admin.credential.cert(json)
        });
        initialized = true;
        return admin;
      } catch (e1) {
        try {
          // Second attempt: treat FIREBASE_SERVICE_ACCOUNT as raw JSON
          const json = JSON.parse(b64);
          admin.initializeApp({
            credential: admin.credential.cert(json)
          });
          initialized = true;
          return admin;
        } catch (e2) {
          console.warn('Firebase SERVICE_ACCOUNT is not valid base64 or JSON. Falling back to application default.');
        }
      }
    }

    // Fallback to default credentials (useful on GCP/Vercel with secrets mounted)
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    initialized = true;
    return admin;
  } catch (err) {
    console.error('Firebase init error:', err.message);
    throw err;
  }
}

module.exports = { initFirebase };
