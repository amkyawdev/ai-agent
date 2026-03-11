# Burme Chat - ဗွီမ်ချက်ခ်

Burmese Language AI Chat Assistant using Google Gemini API.

## Features

- 🔐 User Authentication (Login, Register, Password Reset)
- 💬 Chat in Burmese language with AI
- 🎨 Myanmar traditional theme
- 🌙 Dark/Light mode
- 💾 Chat history saved in MongoDB
- 📱 Responsive design

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Firebase Auth
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas (with in-memory fallback)
- **AI**: Google Gemini API

## Project Structure

```
burme-chat/
├── index.html              # Frontend (Single Page App)
├── backend/
│   ├── server.js          # Express server
│   ├── config/
│   │   └── database.js    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   └── chatController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── chatRoutes.js
│   ├── middleware/
│   │   ├── auth.js        # Firebase auth
│   │   ├── errorHandler.js
│   │   └── logger.js
│   ├── services/
│   │   ├── chatService.js
│   │   ├── geminiService.js
│   │   └── userService.js
│   └── package.json
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/reset` - Password reset
- `GET /api/auth/me` - Get current user
- `POST /api/auth/apikey` - Save Gemini API key
- `GET /api/auth/apikey` - Check API key status

### Chat
- `POST /api/chat` - Send message
- `GET /api/chat/history/:sessionId` - Get chat history
- `POST /api/chat/clear/:sessionId` - Clear chat history
- `GET /api/health` - Health check

## Setup

### 1. MongoDB Atlas
- Create a MongoDB Atlas cluster
- Get connection string

### 2. Firebase
- Create a Firebase project
- Enable Authentication (Email/Password)
- Get Firebase config

### 3. Google Gemini API
- Get API key from Google AI Studio

### 4. Environment Variables
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
FIREBASE_API_KEY=your_firebase_api_key
```

### 5. Run Server
```bash
cd backend
npm install
npm start
```

## Deployment

### Backend (Render/Railway/Heroku)
```bash
npm start
```

### Frontend (Netlify/Vercel/GitHub Pages)
Simply upload `index.html` or connect your repository.

## Screenshots

### Welcome Screen
- Myanmar traditional red/gold gradient
- "မြန်မာလို စကားပြောမယ်" button

### Login Screen
- Tab: Login, Register, Reset Password
- Firebase authentication

### Chat Screen
- Burmese language AI responses
- User messages (red bubble)
- AI messages (white bubble)
- Timestamp display

## License

MIT
