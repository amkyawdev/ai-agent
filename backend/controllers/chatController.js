// Chat Controller with Neon DB - Supports Chat, Code, and Image Generation
const OneHandService = require('../services/oneHandService');
const { saveMessage, getMessages, clearMessages, saveUser } = require('../config/database');

// POST /api/chat - Send message to AI (Chat Mode)
exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    if (!message) {
      return res.status(400).json({ error: 'မေးခွန်းရိုက်ပါရန်။' });
    }

    // Get API key from .env
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API မသတ်မှတ်ရသေးပပါရန်။' });
    }

    // Save user if not exists
    await saveUser(userId, userEmail);

    // Get AI response from OneHand (Chat mode)
    const oneHand = new OneHandService(apiKey);
    const aiResponse = await oneHand.chat(message);

    // Save message to database
    await saveMessage(userId, message, aiResponse);

    res.json({ response: aiResponse, mode: 'chat' });
  } catch (error) {
    console.error('Chat Error:', error.message);
    res.status(500).json({ error: 'မှားယွင်းပါရန်။' });
  }
};

// POST /api/chat/code - Code Generation
exports.sendCode = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    if (!message) {
      return res.status(400).json({ error: 'မေးခွန်းရိုက်ပါရန်။' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API မသတ်မှတ်ရသေးပပါရန်။' });
    }

    await saveUser(userId, userEmail);

    const oneHand = new OneHandService(apiKey);
    const codeResponse = await oneHand.code(message);

    await saveMessage(userId, '[Code] ' + message, codeResponse);

    res.json({ response: codeResponse, mode: 'code' });
  } catch (error) {
    console.error('Code Error:', error.message);
    res.status(500).json({ error: 'Code မှားယွင်းပါရန်။' });
  }
};

// POST /api/chat/image - Image Generation
exports.generateImage = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    if (!prompt) {
      return res.status(400).json({ error: 'ပုံဖန်တီးမည့်စာရိုက်ပါရန်။' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API မသတ်မှတ်ရသေးပပါရန်။' });
    }

    await saveUser(userId, userEmail);

    const oneHand = new OneHandService(apiKey);
    const imageUrl = await oneHand.generateImage(prompt);

    if (!imageUrl) {
      return res.status(500).json({ error: 'ပုံဖန်တီးမှားယွင်းပါရန်။' });
    }

    await saveMessage(userId, '[Image] ' + prompt, imageUrl);

    res.json({ imageUrl, mode: 'image' });
  } catch (error) {
    console.error('Image Error:', error.message);
    res.status(500).json({ error: 'ပုံဖန်တီးမှားယွင်းပါရန်။' });
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
