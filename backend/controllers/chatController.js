const chatService = require('../services/chatService');
const userService = require('../services/userService');

// POST /api/chat - Send message
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.uid;
    
    // Validate input
    if (!message) {
      return res.status(400).json({ error: 'စာရိုက်ပါရန်။' });
    }

    // Get user API key
    const user = await userService.getUser(userId);
    if (!user || !user.apiKey) {
      return res.status(400).json({ error: 'API Key မထည့်သွင်းရသေးပါရန်။' });
    }

    // Generate session ID if not provided
    const chatSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Send message
    const result = await chatService.sendMessage(chatSessionId, message, user.apiKey, userId);

    res.json(result);
  } catch (error) {
    console.error('Send Message Error:', error.message);
    res.status(500).json({ error: error.message || 'မှားယွင်းပါရန်။' });
  }
};

// GET /api/chat/history/:sessionId - Get chat history
exports.getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.uid;

    const history = await chatService.getHistory(sessionId, userId);
    res.json(history);
  } catch (error) {
    console.error('Get History Error:', error.message);
    res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
  }
};

// POST /api/chat/clear/:sessionId - Clear chat history
exports.clearHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.uid;

    const result = await chatService.clearHistory(sessionId, userId);
    
    if (result) {
      res.json({ message: 'စကားပြောခန်းဖျက်ပါရန်။' });
    } else {
      res.status(404).json({ error: 'စကားပြောခန်းမရှိပါရန်။' });
    }
  } catch (error) {
    console.error('Clear History Error:', error.message);
    res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
  }
};
