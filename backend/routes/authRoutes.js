const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Auth handled client-side via Firebase
// Backend just verifies Firebase tokens

// GET /api/auth/me - Get current user (requires valid Firebase token)
router.get('/me', verifyToken, async (req, res) => {
  res.json({ 
    user: {
      uid: req.user.uid,
      email: req.user.email
    }
  });
});

// POST /api/auth/verify - Verify token
router.post('/verify', verifyToken, async (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
