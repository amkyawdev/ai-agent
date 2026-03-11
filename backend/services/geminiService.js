const { GoogleGenerativeAI } = require('@google/generative-ai');

// System prompt for Burmese language
const SYSTEM_PROMPT = `You are Burme Chat, an AI assistant that communicates exclusively in Burmese (Myanmar language). 

Rules:
1. ALWAYS respond ONLY in Burmese (မြန်မာစာ)
2. Never respond in English or any other language
3. Be friendly, respectful, and culturally appropriate for Myanmar users
4. Be helpful and answer questions clearly in Burmese
5. Use proper Burmese grammar and spelling
6. If asked about your identity, say you are Burme Chat - a Burmese AI assistant

Remember: Your response must always be in Burmese!`;

class GeminiService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('API Key လိုအပ်ပါရန်။');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT
    });
  }

  async sendMessage(message, chatHistory = []) {
    try {
      // Build chat history for context
      const history = chatHistory.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Start chat with history
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        }
      });

      // Send message
      const result = await chat.sendMessage(message);
      const response = result.response;
      
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      
      if (error.message.includes('API_KEY')) {
        throw new Error('API Key မှားယွင်းပါရန်။');
      }
      if (error.message.includes('quota')) {
        throw new Error('အသုံးပါးလို့မရပါရန်။');
      }
      if (error.message.includes('blocked')) {
        throw new Error('မလုပ်သင့်တဲ့ စာပါရန်။');
      }
      
      throw new Error('AI မှားယွင်းပါရန်။ ' + error.message);
    }
  }

  async generateContent(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      throw error;
    }
  }
}

module.exports = GeminiService;
