// Firebase configuration for GigCampus
// TODO: Replace with your Firebase project credentials
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  // TODO: Add your Firebase service account key here
  // You can download this from Firebase Console > Project Settings > Service Accounts
  type: "service_account",
  project_id: "your-project-id",
  private_key_id: "your-private-key-id",
  private_key: "your-private-key",
  client_email: "your-client-email",
  client_id: "your-client-id",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "your-cert-url"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
