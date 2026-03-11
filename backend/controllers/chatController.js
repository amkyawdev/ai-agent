// Chat Controller with Neon DB
const GeminiService = require('../services/geminiService');
const { saveMessage, getMessages, clearMessages, saveUser } = require('../config/database');

// POST /api/chat - Send message to Gemini
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, apiKey } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    if (!message) {
      return res.status(400).json({ error: 'မေးခွန်းရိုက်ပါရန်။' });
    }

    // Get API key from header or body
    const geminiApiKey = req.headers['x-gemini-api-key'] || apiKey;
    if (!geminiApiKey) {
      return res.status(400).json({ error: 'API Key လိုအပ်ပါရန်။' });
    }

    // Save user if not exists
    await saveUser(userId, userEmail);

    // Get AI response from Gemini
    const gemini = new GeminiService(geminiApiKey);
    const aiResponse = await gemini.sendMessage(message);

    // Save message to database
    await saveMessage(userId, message, aiResponse);

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat Error:', error.message);
    res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
  }
};

// GET /api/chat/history - Get chat history
exports.getHistory = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    const messages = await getMessages(userId, 50);
    
    res.json({ messages });
  } catch (error) {
    console.error('Get History Error:', error.message);
    res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
  }
};

// POST /api/chat/clear - Clear chat history
exports.clearHistory = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    await clearMessages(userId);
    
    res.json({ message: 'စကားဝှက်ရှင်းပါရန်။' });
  } catch (error) {
    console.error('Clear History Error:', error.message);
    res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
  }
};
