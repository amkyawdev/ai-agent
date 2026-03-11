// Simple Chat Controller (In-Memory)
const { chatWithGemini } = require('../services/geminiService');
const { memoryStorage, memoryInsertOne, memoryFind } = require('../config/database');

// POST /api/chat/message - Send message to Gemini
exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.uid;

    if (!message) {
      return res.status(400).json({ error: 'မေးခွန်းရိုက်ပါရန်။' });
    }

    // Get AI response from Gemini
    const aiResponse = await chatWithGemini(message);

    // Save to memory storage
    memoryInsertOne('messages', {
      userId,
      message,
      response: aiResponse,
      timestamp: new Date()
    });

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
    
    const messages = memoryFind('messages', { userId }, { limit: 50 });
    
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
    
    // Clear messages for this user
    memoryStorage.messages.forEach((msg, key) => {
      if (msg.userId === userId) {
        memoryStorage.messages.delete(key);
      }
    });
    
    res.json({ message: 'စကားဝှက်ရှင်းပါရန်။' });
  } catch (error) {
    console.error('Clear History Error:', error.message);
    res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
  }
};
