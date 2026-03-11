const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const userService = require('../services/userService');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/auth/register - Register new user
router.post('/register',
  body('email').isEmail().withMessage('အီးမေးလ်ပါးလို့မရပါရန်။'),
  body('password').isLength({ min: 6 }).withMessage('စကားဝှက်သည် အနည်းဆုံး စာလုံး ၆ လုံးလိုအပ်ပါရန်။'),
  validateRequest,
  authController.register
);

// POST /api/auth/login - Login (verifies token)
router.post('/login', verifyToken, authController.login);

// POST /api/auth/reset - Reset password
router.post('/reset',
  body('email').isEmail().withMessage('အီးမေးလ်ပါးလို့မရပါရန်။'),
  validateRequest,
  authController.reset
);

// GET /api/auth/me - Get current user
router.get('/me', verifyToken, authController.me);

// POST /api/auth/apikey - Update user's Gemini API key
router.post('/apikey',
  verifyToken,
  body('apiKey').notEmpty().withMessage('API Key လိုအပ်ပါရန်။'),
  validateRequest,
  async (req, res) => {
    try {
      const { apiKey } = req.body;
      const userId = req.user.uid;
      
      const user = await userService.updateApiKey(userId, apiKey);
      
      if (!user) {
        return res.status(404).json({ error: 'အသုံးပါးလို့မရပါရန်။' });
      }
      
      res.json({ message: 'API Key သိမ်းပါရန်။' });
    } catch (error) {
      console.error('Update API Key Error:', error.message);
      res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
    }
  }
);

// GET /api/auth/apikey - Get user's API key status
router.get('/apikey',
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const user = await userService.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'အသုံးပါးလို့မရပါရန်။' });
      }
      
      res.json({ hasApiKey: !!user.apiKey });
    } catch (error) {
      console.error('Get API Key Error:', error.message);
      res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
    }
  }
);

module.exports = router;
