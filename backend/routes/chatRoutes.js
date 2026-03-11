const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const chatController = require('../controllers/chatController');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/chat - Send message
// Headers: Authorization: Bearer <firebase_id_token>
router.post('/', 
  require('../middleware/auth').verifyToken,
  body('message').trim().notEmpty().withMessage('စာရိုက်ပါရန်။'),
  validateRequest,
  chatController.sendMessage
);

// GET /api/chat/history/:sessionId - Get chat history
router.get('/history/:sessionId',
  require('../middleware/auth').verifyToken,
  chatController.getHistory
);

// POST /api/chat/clear/:sessionId - Clear chat history
router.post('/clear/:sessionId',
  require('../middleware/auth').verifyToken,
  chatController.clearHistory
);

module.exports = router;
