const { Pool } = require('pg');
require('dotenv').config();

// Neon PostgreSQL connection
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 3000
  });
}

let useMemory = false;

// In-memory fallback storage
const memoryStorage = {
  users: new Map(),
  sessions: new Map(),
  messages: new Map()
};

async function connectDB() {
  if (!pool) {
    console.log('📦 In-memory storage အသုံးပါရန်။ (No DATABASE_URL)');
    useMemory = true;
    return null;
  }
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('🟢 Neon DB (PostgreSQL) ချိတ်ဆက်ပါရန်။');
    
    // Create tables if not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
    `);
    console.log('📋 Tables စစ်ဆေးပါရန်။');
    
    return pool;
  } catch (error) {
    console.warn('⚠️ Neon DB မချိတ်ဆက်ရသဖြင့်အသုံးပါရန်။', error.message);
    useMemory = true;
    return null;
  }
}

function getDB() {
  return pool;
}

function isUsingMemory() {
  return useMemory;
}

async function closeDB() {
  try {
    if (pool) {
      await pool.end();
      console.log('🔴 Neon DB ပိတ်ပါရန်။');
    }
  } catch (error) {
    console.error('Neon DB Close Error:', error.message);
  }
}

// ==================== Database Operations ====================

// Users
async function saveUser(uid, email) {
  if (useMemory || !pool) {
    const id = 'user-' + uid;
    memoryStorage.users.set(id, { uid, email, createdAt: new Date() });
    return { uid, email };
  }
  
  try {
    await pool.query(
      'INSERT INTO users (uid, email) VALUES ($1, $2) ON CONFLICT (uid) DO NOTHING',
      [uid, email]
    );
    return { uid, email };
  } catch (error) {
    console.error('Save User Error:', error.message);
    return { uid, email };
  }
}

async function getUserByUid(uid) {
  if (useMemory || !pool) {
    for (const user of memoryStorage.users.values()) {
      if (user.uid === uid) return user;
    }
    return null;
  }
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE uid = $1', [uid]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Get User Error:', error.message);
    return null;
  }
}

// Messages
async function saveMessage(userId, userMessage, aiResponse) {
  if (useMemory || !pool) {
    const id = 'msg-' + Date.now();
    memoryStorage.messages.set(id, { userId, userMessage, aiResponse, createdAt: new Date() });
    return { id, userId, userMessage, aiResponse };
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO messages (user_id, user_message, ai_response) VALUES ($1, $2, $3) RETURNING *',
      [userId, userMessage, aiResponse]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Save Message Error:', error.message);
    return { userId, userMessage, aiResponse };
  }
}

async function getMessages(userId, limit = 50) {
  if (useMemory || !pool) {
    const messages = [];
    for (const msg of memoryStorage.messages.values()) {
      if (msg.userId === userId) messages.push(msg);
    }
    return messages.slice(-limit);
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows.reverse();
  } catch (error) {
    console.error('Get Messages Error:', error.message);
    return [];
  }
}

async function clearMessages(userId) {
  if (useMemory || !pool) {
    for (const [key, msg] of memoryStorage.messages.entries()) {
      if (msg.userId === userId) {
        memoryStorage.messages.delete(key);
      }
    }
    return { deletedCount: 1 };
  }
  
  try {
    const result = await pool.query('DELETE FROM messages WHERE user_id = $1', [userId]);
    return { deletedCount: result.rowCount };
  } catch (error) {
    console.error('Clear Messages Error:', error.message);
    return { deletedCount: 0 };
  }
}

// In-memory helpers (fallback)
function memoryFindOne(collection, query) {
  const data = memoryStorage[collection];
  if (!data) return null;
  
  for (const [key, value] of data.entries()) {
    let match = true;
    for (const [k, v] of Object.entries(query)) {
      if (value[k] !== v) { match = false; break; }
    }
    if (match) return value;
  }
  return null;
}

function memoryFind(collection, query = {}, options = {}) {
  const data = memoryStorage[collection];
  if (!data) return [];
  
  let results = [];
  for (const [key, value] of data.entries()) {
    let match = true;
    for (const [k, v] of Object.entries(query)) {
      if (value[k] !== v) { match = false; break; }
    }
    if (match) results.push(value);
  }
  
  if (options.sort) {
    const sortKey = Object.keys(options.sort)[0];
    results.sort((a, b) => options.sort[sortKey] === 1 ? a[sortKey] > b[sortKey] : a[sortKey] < b[sortKey]);
  }
  if (options.limit) results = results.slice(0, options.limit);
  
  return results;
}

module.exports = {
  connectDB,
  getDB,
  closeDB,
  isUsingMemory,
  saveUser,
  getUserByUid,
  saveMessage,
  getMessages,
  clearMessages,
  pool,
  memoryStorage
};
