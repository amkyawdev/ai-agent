// Auth Controller (In-Memory)
const { registerUser, loginUser, resetPassword, getUserByUID, users } = require('../middleware/auth');

// POST /api/auth/register - Register new user
exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'အီးမေးလ်နှင့် စကားဝှက်ထည့်သွင်းပါရန်။' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'စကားဝှက်သည် အနည်းဆုံး စာလုံး ၆ လုံးလိုအပ်ပါရန်။' 
      });
    }

    const user = await registerUser(email, password);

    res.status(201).json({
      message: 'မှတ်ပုံတင်ပါရန်။',
      user: { uid: user.uid, email: user.email, token: user.token }
    });
  } catch (error) {
    console.error('Register Error:', error.message);
    
    if (error.message.includes('ရှိပြီး')) {
      return res.status(400).json({ error: 'ဤအီးမေးလ်သည် ရှိပြီးပါရန်။' });
    }
    
    res.status(500).json({ error: 'မှတ်ပုံတင်မှားယွင်းပါရန်။' });
  }
};

// POST /api/auth/login - Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'အီးမေးလ်နှင့် စကားဝှက်ထည့်သွင်းပါရန်။' 
      });
    }

    const user = await loginUser(email, password);

    res.json({
      message: 'လော့ဂ်အင်အောင်မြင်ပါရန်။',
      user: { uid: user.uid, email: user.email, token: user.token }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(401).json({ error: 'အီးမေးလ်သို့မဟုတ်စကားဝှက်မှားယွင်းပါရန်။' });
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
    res.status(404).json({ error: 'ဤအီးမေးလ်သည် မရှိပါရန်။' });
  }
};

// GET /api/auth/me - Get current user
exports.me = async (req, res, next) => {
  try {
    const { uid } = req.user;
    
    const user = await getUserByUID(uid);
    
    if (!user) {
      return res.status(404).json({ error: 'အသုံးပါးလို့မရပါရန်။' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get User Error:', error.message);
    res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
  }
};
