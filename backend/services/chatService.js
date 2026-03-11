// Chat Service - MongoDB with Memory Fallback
const { ObjectId } = require('mongodb');
const { getDB, memoryFindOne, memoryInsertOne, memoryUpdateOne, memoryFind, memoryDeleteOne } = require('../config/database');
const GeminiService = require('./geminiService');

class ChatService {
  // Send message and get AI response
  async sendMessage(sessionId, userMessage, apiKey, userId) {
    if (!userMessage || !userMessage.trim()) {
      throw new Error('စာရိုက်ပါရန်။');
    }

    if (!apiKey) {
      throw new Error('API Key လိုအပ်ပါရန်။');
    }

    const db = getDB();
    
    // Get or create session
    let session;
    let sessionKey = { sessionId, userId };
    
    if (db) {
      session = await db.collection('sessions').findOne(sessionKey);
      
      if (!session) {
        const result = await db.collection('sessions').insertOne({
          sessionId,
          userId: new ObjectId(userId),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        session = { _id: result.insertedId, sessionId, userId: new ObjectId(userId), messages: [] };
      }

      // Get chat history
      const messages = await db.collection('messages')
        .find({ sessionId: session._id })
        .sort({ createdAt: 1 })
        .limit(20)
        .toArray();

      var chatHistory = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      // Add user message
      await db.collection('messages').insertOne({
        sessionId: session._id,
        sender: 'user',
        text: userMessage.trim(),
        createdAt: new Date()
      });

      // Initialize Gemini service
      const geminiService = new GeminiService(apiKey);
      const aiResponse = await geminiService.sendMessage(userMessage, chatHistory);

      // Add AI response
      await db.collection('messages').insertOne({
        sessionId: session._id,
        sender: 'ai',
        text: aiResponse,
        createdAt: new Date()
      });

      // Update session
      await db.collection('sessions').updateOne(
        { _id: session._id },
        { $set: { updatedAt: new Date() } }
      );

      return {
        reply: aiResponse,
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      };
    } else {
      // Memory storage
      session = memoryFindOne('sessions', sessionKey);
      
      if (!session) {
        const result = memoryInsertOne('sessions', {
          sessionId,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        session = { _id: result.insertedId, sessionId, userId };
      }

      // Get chat history
      const allMessages = memoryFind('messages', { sessionId: session._id }, { sort: { createdAt: 1 }, limit: 20 });
      var chatHistory = allMessages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      // Add user message
      memoryInsertOne('messages', {
        sessionId: session._id,
        sender: 'user',
        text: userMessage.trim(),
        createdAt: new Date()
      });

      // Initialize Gemini service
      const geminiService = new GeminiService(apiKey);
      const aiResponse = await geminiService.sendMessage(userMessage, chatHistory);

      // Add AI response
      memoryInsertOne('messages', {
        sessionId: session._id,
        sender: 'ai',
        text: aiResponse,
        createdAt: new Date()
      });

      // Update session
      memoryUpdateOne('sessions', { _id: session._id }, { $set: { updatedAt: new Date() } });

      return {
        reply: aiResponse,
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      };
    }
  }

  // Get chat history
  async getHistory(sessionId, userId) {
    const db = getDB();
    
    if (db) {
      const session = await db.collection('sessions').findOne({ sessionId, userId: new ObjectId(userId) });
      
      if (!session) {
        return { sessionId, messages: [] };
      }

      const messages = await db.collection('messages')
        .find({ sessionId: session._id })
        .sort({ createdAt: 1 })
        .toArray();

      return {
        sessionId: session.sessionId,
        messages: messages.map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.createdAt.toISOString()
        }))
      };
    } else {
      // Memory storage
      const session = memoryFindOne('sessions', { sessionId, userId });
      
      if (!session) {
        return { sessionId, messages: [] };
      }

      const messages = memoryFind('messages', { sessionId: session._id }, { sort: { createdAt: 1 } });

      return {
        sessionId: session.sessionId,
        messages: messages.map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.createdAt.toISOString()
        }))
      };
    }
  }

  // Clear chat history
  async clearHistory(sessionId, userId) {
    const db = getDB();
    
    if (db) {
      const session = await db.collection('sessions').findOne({ sessionId, userId: new ObjectId(userId) });
      
      if (!session) {
        return false;
      }

      await db.collection('messages').deleteMany({ sessionId: session._id });
      await db.collection('sessions').updateOne(
        { _id: session._id },
        { $set: { updatedAt: new Date() } }
      );
      
      return true;
    } else {
      // Memory storage
      const session = memoryFindOne('sessions', { sessionId, userId });
      
      if (!session) {
        return false;
      }

      // Delete messages
      const messages = memoryFind('messages', { sessionId: session._id });
      for (const msg of messages) {
        memoryDeleteOne('messages', { _id: msg._id });
      }

      memoryUpdateOne('sessions', { _id: session._id }, { $set: { updatedAt: new Date() } });
      
      return true;
    }
  }

  // Get all sessions for user
  async getAllSessions(userId) {
    const db = getDB();
    
    if (db) {
      return await db.collection('sessions')
        .find({ userId: new ObjectId(userId) })
        .sort({ updatedAt: -1 })
        .toArray();
    } else {
      return memoryFind('sessions', { userId }, { sort: { updatedAt: -1 } });
    }
  }
}

module.exports = new ChatService();
