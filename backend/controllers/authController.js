// Auth Controller
const { registerUser, resetPassword, getUserByUID } = require('../middleware/auth');
const userService = require('../services/userService');

// POST /api/auth/register - Register new user
exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'အီးမေးလ်နှင့် စကားဝှက်ထည့်သွင်းပါရန်။' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'စကားဝှက်သည် အနည်းဆုံး စာလုံး ၆ လုံးလိုအပ်ပါရန်။' 
      });
    }

    // Register with Firebase
    const user = await registerUser(email, password);

    // Save to local database
    await userService.createUser(user.uid, email);

    res.status(201).json({
      message: 'အောင်မြင်ပါရန်။',
      user: { uid: user.uid, email: user.email }
    });
  } catch (error) {
    console.error('Register Error:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'ဤအီးမေးလ်သည် ရှိပြီးပါရန်။' });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'အီးမေးလ်ပါးလို့မရပါရန်။' });
    }
    
    res.status(500).json({ error: 'မှတ်ပုံတင်မှားယွင်းပါရန်။' });
  }
};

// POST /api/auth/login - Login (returns ID token for verification)
// Note: Login is done on client-side with Firebase Auth
// This endpoint verifies the token and returns user data
exports.login = async (req, res, next) => {
  try {
    const { uid } = req.user; // From auth middleware
    
    // Get user from database
    const user = await userService.getUser(uid);
    
    if (!user) {
      return res.status(404).json({ error: 'အသုံးပါးလို့မရပါရန်။' });
    }

    res.json({
      message: 'လော့ဂ်အင်အောင်မြင်ပါရန်။',
      user: {
        uid: user.uid,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'လော့ဂ်အင်မှားယွင်းပါရန်။' });
  }
};

// POST /api/auth/reset - Reset password
exports.reset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'အီးမေးလ်ထည့်သွင်းပါရန်။' 
      });
    }

    await resetPassword(email);

    res.json({
      message: 'ပါဆယ်လိုက်ပါရန်။ အီးမေးလ်သို့ သတင်းပါဝင်ပါရန်။'
    });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'ဤအီးမေးလ်သည် မရှိပါရန်။' });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'အီးမေးလ်ပါးလို့မရပါရန်။' });
    }
    
    res.status(500).json({ error: 'ပါဆယ်လိုက်မှားယွင်းပါရန်။' });
  }
};

// GET /api/auth/me - Get current user
exports.me = async (req, res, next) => {
  try {
    const { uid } = req.user;
    
    const user = await userService.getUser(uid);
    
    if (!user) {
      return res.status(404).json({ error: 'အသုံးပါးလို့မရပါရန်။' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get User Error:', error.message);
    res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
  }
};
