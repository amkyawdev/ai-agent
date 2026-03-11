// In-memory database storage
const memoryStorage = {
  users: new Map(),
  sessions: new Map(),
  messages: new Map()
};

let useMemory = true;

async function connectDB() {
  console.log('📦 In-memory storage အသုံးပါရန်။');
  return null;
}

function getDB() {
  return null;
}

function isUsingMemory() {
  return true;
}

async function closeDB() {
  console.log('🔴 In-memory storage ပိတ်ပါရန်။');
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
  
  if (options.sort) {
    const sortKey = Object.keys(options.sort)[0];
    const sortOrder = options.sort[sortKey];
    results.sort((a, b) => {
      if (sortOrder === 1) return a[sortKey] > b[sortKey] ? 1 : -1;
      return a[sortKey] < b[sortKey] ? 1 : -1;
    });
  }
  
  if (options.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
}

function memoryInsertOne(collection, document) {
  const data = memoryStorage[collection];
  if (!data) return { insertedId: 'memory-' + Date.now() };
  
  const id = document.id || document.uid || 'memory-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  data.set(id, { ...document, id });
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

module.exports = {
  connectDB,
  getDB,
  closeDB,
  isUsingMemory,
  memoryStorage,
  memoryFindOne,
  memoryFind,
  memoryInsertOne,
  memoryUpdateOne,
  memoryDeleteOne
};
