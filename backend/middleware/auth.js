// Firebase Auth Middleware
require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
let firebaseInitialized = false;

try {
  // Check if already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID || 'smart-burme-app',
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      })
    });
  }
  firebaseInitialized = true;
} catch (error) {
  console.log('⚠️ Firebase Admin မစတင်ရပါရန်။', error.message);
}

// Verify Firebase Token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'လိုင်းပါးလို့မရပါရန်။',
        code: 'NO_TOKEN' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!firebaseInitialized) {
      return res.status(500).json({ 
        error: 'Firebase မစတင်ရသေးပပါရန်။',
        code: 'FIREBASE_NOT_INITIALIZED' 
      });
    }

    // Verify with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false
    };
    
    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    return res.status(401).json({ 
      error: 'လိုင်းမှားယွင်းပါရန်။',
      code: 'INVALID_TOKEN' 
    });
  }
};

// Get user by UID from Firebase
const getUserByUID = async (uid) => {
  if (!firebaseInitialized) return null;
  
  try {
    const user = await admin.auth().getUser(uid);
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    };
  } catch (error) {
    return null;
  }
};

// Register/Login via Firebase (handled client-side)
// These are placeholder functions
const registerUser = async (email, password) => {
  throw new Error('ဤအပိုင်းသည် Firebase ဖြင့် လုပ်ပါရန်။');
};

const loginUser = async (email, password) => {
  throw new Error('ဤအပိုင်းသည် Firebase ဖြင့် လုပ်ပါရန်။');
};

const resetPassword = async (email) => {
  throw new Error('ဤအပိုင်းသည် Firebase ဖြင့် လုပ်ပါရန်။');
};

module.exports = {
  verifyToken,
  registerUser,
  loginUser,
  resetPassword,
  getUserByUID,
  firebaseInitialized
};
