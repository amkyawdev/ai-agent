require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB, closeDB } = require('./config/database');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - 10 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'အလွန်အကျွံတောင်းဆိုပါရန်။ နောက်တစ်ခါ ကြိုးစားပါရန်။' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());

// Logging middleware
app.use(requestLogger);

// Health check
app.get('/api/health', async (req, res) => {
  const { isUsingMemory } = require('./config/database');
  res.json({ 
    status: 'ok', 
    database: isUsingMemory() ? 'in-memory' : 'connected', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'ဒါမှမဟုတ်ပါရန်။' });
});

// Start server with MongoDB connection
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🟢 Burme Chat Server လုပ်နေပါရန်။ Port: ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔴 Server ပိတ်နေပါရန်။');
  await closeDB();
  process.exit(0);
});

startServer();

module.exports = app;
