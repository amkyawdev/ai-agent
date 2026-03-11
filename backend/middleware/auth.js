const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config();

let auth = null;

// Try to initialize Firebase Admin
try {
  const serviceAccount = require('../serviceAccountKey.json');
  if (serviceAccount && serviceAccount.private_key && serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
    initializeApp({
      credential: cert(serviceAccount)
    });
    auth = getAuth();
    console.log('🔥 Firebase Admin လုပ်နေပါရန်။');
  }
} catch (error) {
  // Service account file doesn't exist or is invalid - will use fallback
  console.warn('⚠️ Firebase Admin SDK မလုပ်သင့်ပါရန်။ JWT သွင်းခြင်းဖြင့်အသုံးပါရန်။');
}

// Firebase config from env
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA5BS_7xfD1-VhGYlBfkKLBkHUKnkZXBsg",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "amkyawdev.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "amkyawdev",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "amkyawdev.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "242883286611",
  appId: process.env.FIREBASE_APP_ID || "1:242883286611:web:a61ea6d9d294c49b0618a6",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-VF8XVGCWM2"
};

// Verify Firebase ID Token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'လိုင်းပါးလို့မရပါရန်။',
        code: 'NO_TOKEN' 
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify with Firebase Admin
    if (auth) {
      const decodedToken = await auth.verifyIdToken(idToken);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        emailVerified: decodedToken.email_verified || false,
        name: decodedToken.name || '',
        picture: decodedToken.picture || ''
      };
    } else {
      // Fallback: decode JWT manually (for development only)
      const decoded = decodeJWT(idToken);
      if (!decoded) {
        return res.status(401).json({ 
          error: 'လိုင်းမှားယွင်းပါရန်။',
          code: 'INVALID_TOKEN' 
        });
      }
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'လိုင်းသက်တမ်းကုန်ပါရန်။',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    return res.status(401).json({ 
      error: 'လိုင်းမှားယွင်းပါရန်။',
      code: 'INVALID_TOKEN' 
    });
  }
};

// Helper: Decode JWT (fallback)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email || '',
      emailVerified: payload.email_verified || false,
      name: payload.name || '',
      picture: payload.picture || ''
    };
  } catch {
    return null;
  }
}

// Register new user
const registerUser = async (email, password) => {
  try {
    if (!auth) {
      throw new Error('Firebase Admin မလုပ်သင့်ပါရန်။');
    }
    
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false
    });
    
    return {
      uid: userRecord.uid,
      email: userRecord.email
    };
  } catch (error) {
    console.error('Register Error:', error.message);
    throw error;
  }
};

// Reset password
const resetPassword = async (email) => {
  // Firebase Admin SDK cannot send password reset emails directly
  // Use Firebase Auth REST API instead
  const apiKey = firebaseConfig.apiKey;
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return { success: true, message: 'ပါဆယ်လိုက်ပါရန်။' };
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    throw error;
  }
};

// Get user by UID
const getUserByUID = async (uid) => {
  try {
    if (!auth) {
      throw new Error('Firebase Admin မလုပ်သင့်ပါရန်။');
    }
    
    const userRecord = await auth.getUser(uid);
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      createdAt: userRecord.metadata.creationTime
    };
  } catch (error) {
    console.error('Get User Error:', error.message);
    throw error;
  }
};

module.exports = {
  verifyToken,
  registerUser,
  resetPassword,
  getUserByUID,
  firebaseConfig
};
