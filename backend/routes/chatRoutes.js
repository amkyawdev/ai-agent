const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/chat - Send message
router.post('/', 
  verifyToken,
  body('message').trim().notEmpty().withMessage('စာရိုက်ပါရန်။'),
  validateRequest,
  chatController.sendMessage
);

// GET /api/chat/history - Get chat history
router.get('/history',
  verifyToken,
  chatController.getHistory
);

// POST /api/chat/clear - Clear chat history
router.post('/clear',
  verifyToken,
  chatController.clearHistory
);

module.exports = router;
