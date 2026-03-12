// OneHand AI Service (OpenAI Compatible)
const OpenAI = require('openai');

class OneHandService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.onehand.ai/v1'
    });
  }

  // Chat Mode
  async chat(message) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that responds in Burmese (Myanmar) language. Respond in Burmese script only.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || 'မှားယွင်းပါရန်။';
    } catch (error) {
      console.error('OneHand Chat API Error:', error.message);
      throw new Error('AI မှားယွင်းပါရန်။');
    }
  }

  // Coder Mode
  async code(message) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a coding assistant. Provide code solutions with explanations. Respond in Burmese (Myanmar) language for explanations, but include code in English.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 2000,
        temperature: 0.5
      });

      return completion.choices[0]?.message?.content || 'မှားယွင်းပါရန်။';
    } catch (error) {
      console.error('OneHand Code API Error:', error.message);
      throw new Error('Code မှားယွင်းပါရန်။');
    }
  }

  // Image Generator Mode (using DALL-E)
  async generateImage(prompt) {
    try {
      const completion = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024'
      });

      return completion.data[0]?.url || null;
    } catch (error) {
      console.error('OneHand Image API Error:', error.message);
      throw new Error('ပုံဖန်တီးမှားယွင်းပါရန်။');
    }
  }
}

module.exports = OneHandService;
