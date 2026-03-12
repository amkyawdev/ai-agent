// Simple Auth Middleware
require('dotenv').config();
const { saveUser } = require('../config/database');

// Simple token verification (for demo - in production use proper JWT)
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
    
    // Simple token format: uid:email:timestamp
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [uid, email] = decoded.split(':');
      
      if (!uid) {
        return res.status(401).json({ 
          error: 'လိုင်းမှားယွင်းပါရန်။',
          code: 'INVALID_TOKEN' 
        });
      }
      
      // Save user to database
      await saveUser(uid, email || '');
      
      req.user = { uid, email: email || '' };
      next();
    } catch (e) {
      return res.status(401).json({ 
        error: 'လိုင်းမှားယွင်းပါရန်။',
        code: 'INVALID_TOKEN' 
      });
    }
  } catch (error) {
    console.error('Auth Error:', error.message);
    return res.status(401).json({ 
      error: 'လိုင်းမှားယွင်းပါရန်။',
      code: 'INVALID_TOKEN' 
    });
  }
};

module.exports = { verifyToken };
