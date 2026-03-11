// User Service - MongoDB with Memory Fallback
const { ObjectId } = require('mongodb');
const { getDB, isUsingMemory, memoryFindOne, memoryInsertOne, memoryUpdateOne, memoryFind, memoryDeleteOne } = require('../config/database');

class UserService {
  // Create new user
  async createUser(uid, email) {
    const db = getDB();
    const user = {
      uid,
      email,
      apiKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        darkMode: false,
        notifications: true
      }
    };
    
    if (db) {
      const result = await db.collection('users').insertOne(user);
      return { ...user, _id: result.insertedId };
    } else {
      const result = memoryInsertOne('users', user);
      return { ...user, _id: result.insertedId };
    }
  }

  // Get user by UID
  async getUser(uid) {
    const db = getDB();
    if (db) {
      return await db.collection('users').findOne({ uid });
    } else {
      return memoryFindOne('users', { uid });
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    const db = getDB();
    if (db) {
      return await db.collection('users').findOne({ email });
    } else {
      return memoryFindOne('users', { email });
    }
  }

  // Update user
  async updateUser(uid, updates) {
    const db = getDB();
    if (db) {
      return await db.collection('users').findOneAndUpdate(
        { uid },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
    } else {
      memoryUpdateOne('users', { uid }, { $set: { ...updates, updatedAt: new Date() } });
      return memoryFindOne('users', { uid });
    }
  }

  // Update user's Gemini API key
  async updateApiKey(uid, apiKey) {
    const db = getDB();
    if (db) {
      return await db.collection('users').findOneAndUpdate(
        { uid },
        { $set: { apiKey, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
    } else {
      memoryUpdateOne('users', { uid }, { $set: { apiKey, updatedAt: new Date() } });
      return memoryFindOne('users', { uid });
    }
  }

  // Delete user
  async deleteUser(uid) {
    const db = getDB();
    if (db) {
      const result = await db.collection('users').deleteOne({ uid });
      return result.deletedCount > 0;
    } else {
      const result = memoryDeleteOne('users', { uid });
      return result.deletedCount > 0;
    }
  }

  // Get all users
  async getAllUsers() {
    const db = getDB();
    if (db) {
      return await db.collection('users').find({}).toArray();
    } else {
      return memoryFind('users');
    }
  }

  // Update user settings
  async updateSettings(uid, settings) {
    const db = getDB();
    if (db) {
      return await db.collection('users').findOneAndUpdate(
        { uid },
        { $set: { settings, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
    } else {
      memoryUpdateOne('users', { uid }, { $set: { settings, updatedAt: new Date() } });
      return memoryFindOne('users', { uid });
    }
  }
}

module.exports = new UserService();
