const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

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

// POST /api/auth/login - Login
router.post('/login', authController.login);

// POST /api/auth/reset - Reset password
router.post('/reset',
  body('email').isEmail().withMessage('အီးမေးလ်ပါးလို့မရပါရန်။'),
  validateRequest,
  authController.reset
);

// GET /api/auth/me - Get current user
router.get('/me', verifyToken, authController.me);

module.exports = router;
