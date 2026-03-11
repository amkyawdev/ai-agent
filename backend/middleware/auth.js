// Simple Auth Middleware (In-Memory)
require('dotenv').config();

// In-memory user storage
const users = new Map();

// Firebase config for client-side (optional)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || ""
};

// Simple token verification (for demo purposes)
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
    
    // Simple token format: email:timestamp (for demo)
    // In production, use proper JWT or session
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const user = users.get(decoded.email);
      
      if (!user || user.token !== token) {
        return res.status(401).json({ 
          error: 'လိုင်းမှားယွင်းပါရန်။',
          code: 'INVALID_TOKEN' 
        });
      }
      
      req.user = {
        uid: user.uid,
        email: user.email
      };
    } catch (e) {
      return res.status(401).json({ 
        error: 'လိုင်းမှားယွင်းပါရန်။',
        code: 'INVALID_TOKEN' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    return res.status(401).json({ 
      error: 'လိုင်းမှားယွင်းပါရန်။',
      code: 'INVALID_TOKEN' 
    });
  }
};

// Register new user
const registerUser = async (email, password) => {
  if (users.has(email)) {
    throw new Error('ဤအီးမေးလ်သည် ရှိပြီးပါရန်။');
  }
  
  const uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const token = Buffer.from(JSON.stringify({ email, timestamp: Date.now() })).toString('base64');
  
  users.set(email, {
    uid,
    email,
    password, // In production, hash this!
    token,
    createdAt: new Date()
  });
  
  return {
    uid,
    email,
    token
  };
};

// Login user
const loginUser = async (email, password) => {
  const user = users.get(email);
  
  if (!user || user.password !== password) {
    throw new Error('အီးမေးလ်သို့မဟုတ်စကားဝှက်မှားယွင်းပါရန်။');
  }
  
  const token = Buffer.from(JSON.stringify({ email, timestamp: Date.now() })).toString('base64');
  user.token = token;
  users.set(email, user);
  
  return {
    uid: user.uid,
    email: user.email,
    token
  };
};

// Reset password (simplified)
const resetPassword = async (email) => {
  if (!users.has(email)) {
    throw new Error('ဤအီးမေးလ်သည် မရှိပါရန်။');
  }
  return { success: true, message: 'ပါဆယ်လိုက်ပါရန်။ အီးမေးလ်သို့ သတင်းပါဝင်ပါရန်။' };
};

// Get user by UID
const getUserByUID = async (uid) => {
  for (const user of users.values()) {
    if (user.uid === uid) {
      return {
        uid: user.uid,
        email: user.email,
        createdAt: user.createdAt
      };
    }
  }
  return null;
};

module.exports = {
  verifyToken,
  registerUser,
  loginUser,
  resetPassword,
  getUserByUID,
  firebaseConfig,
  users
};
