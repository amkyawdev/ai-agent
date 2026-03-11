const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB Atlas connection - use environment variables
const mongoUser = process.env.MONGODB_USER;
const mongoPass = process.env.MONGODB_PASS;
const clusterUrl = process.env.MONGODB_CLUSTER_URL;

let uri = process.env.MONGODB_URI;
if (!uri && mongoUser && mongoPass && clusterUrl) {
  uri = `mongodb+srv://${mongoUser}:${encodeURIComponent(mongoPass)}@${clusterUrl}.mongodb.net/?retryWrites=true&w=majority`;
}

const client = new MongoClient(uri, {
  maxPoolSize: 10,
  minPoolSize: 1,
});

let db = null;
let useMemory = false;

// In-memory fallback storage
const memoryStorage = {
  users: new Map(),
  sessions: new Map(),
  messages: new Map()
};

async function connectDB() {
  try {
    await client.connect();
    db = client.db('burme_chat');
    
    // Test connection
    await db.command({ ping: 1 });
    
    // Create indexes
    await createIndexes();
    
    console.log('🟢 MongoDB ချိတ်ဆက်ပါရန်။');
    return db;
  } catch (error) {
    console.warn('⚠️ MongoDB မချိတ်ဆက်ရသဖြင့်အသုံးပါရန်။', error.message);
    console.log('📦 In-memory storage အသုံးပါရန်။');
    useMemory = true;
    return null;
  }
}

async function createIndexes() {
  if (!db) return;
  
  try {
    await db.collection('users').createIndex({ uid: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ userId: 1 });
    await db.collection('sessions').createIndex({ createdAt: -1 });
    await db.collection('messages').createIndex({ sessionId: 1, createdAt: -1 });
    console.log('📇 Indexes ဖန်တီးပါရန်။');
  } catch (error) {
    console.error('Index creation error:', error.message);
  }
}

function getDB() {
  if (useMemory) return null;
  if (!db) {
    throw new Error('Database မချိတ်ဆက်ရသေးပါရန်။');
  }
  return db;
}

function isUsingMemory() {
  return useMemory;
}

// Memory storage helpers
function memoryFindOne(collection, query) {
  const data = memoryStorage[collection];
  if (!data) return null;
  
  for (const [key, value] of data.entries()) {
    let match = true;
    for (const [k, v] of Object.entries(query)) {
      if (value[k] !== v) {
        match = false;
        break;
      }
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
      if (value[k] !== v) {
        match = false;
        break;
      }
    }
    if (match) results.push(value);
  }
  
  // Sort
  if (options.sort) {
    const sortKey = Object.keys(options.sort)[0];
    const sortOrder = options.sort[sortKey];
    results.sort((a, b) => {
      if (sortOrder === 1) return a[sortKey] > b[sortKey] ? 1 : -1;
      return a[sortKey] < b[sortKey] ? 1 : -1;
    });
  }
  
  // Limit
  if (options.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
}

function memoryInsertOne(collection, document) {
  const data = memoryStorage[collection];
  if (!data) return { insertedId: 'memory-' + Date.now() };
  
  const id = document._id || 'memory-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  data.set(id, { ...document, _id: id });
  return { insertedId: id };
}

function memoryUpdateOne(collection, query, update) {
  const data = memoryStorage[collection];
  if (!data) return { modifiedCount: 0 };
  
  for (const [key, value] of data.entries()) {
    let match = true;
    for (const [k, v] of Object.entries(query)) {
      if (value[k] !== v) {
        match = false;
        break;
      }
    }
    if (match) {
      const newValue = { ...value, ...update.$set };
      data.set(key, newValue);
      return { modifiedCount: 1 };
    }
  }
  return { modifiedCount: 0 };
}

function memoryDeleteOne(collection, query) {
  const data = memoryStorage[collection];
  if (!data) return { deletedCount: 0 };
  
  for (const [key, value] of data.entries()) {
    let match = true;
    for (const [k, v] of Object.entries(query)) {
      if (value[k] !== v) {
        match = false;
        break;
      }
    }
    if (match) {
      data.delete(key);
      return { deletedCount: 1 };
    }
  }
  return { deletedCount: 0 };
}

async function closeDB() {
  try {
    await client.close();
    console.log('🔴 MongoDB ပိတ်ပါရန်။');
  } catch (error) {
    console.error('MongoDB Close Error:', error.message);
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB,
  isUsingMemory,
  client,
  memoryStorage,
  memoryFindOne,
  memoryFind,
  memoryInsertOne,
  memoryUpdateOne,
  memoryDeleteOne
};
