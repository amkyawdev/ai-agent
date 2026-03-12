// Chat Controller with Neon DB
const OpenAI = require('openai');
const { saveMessage, getMessages, clearMessages, saveUser } = require('../config/database');

// POST /api/chat - Send message to OpenAI
exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    if (!message) {
      return res.status(400).json({ error: 'မေးခွန်းရိုက်ပါရန်။' });
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'Server မှာ API Key မရှိပါရန်။' });
    }

    // Save user if not exists
    await saveUser(userId, userEmail);

    // Get AI response from OpenAI
    const openai = new OpenAI({ apiKey: openaiApiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are Burme Chat, a helpful AI assistant that responds in Burmese (Myanmar) language only. Always respond in Burmese.' 
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0]?.message?.content || 'မှားယွင်းပါရန်။';

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
