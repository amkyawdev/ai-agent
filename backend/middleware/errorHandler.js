// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Default error
  let error = 'မှားယွင်းပါရန်။';
  let statusCode = 500;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    error = 'ဤအရာသည် ရှိပြီးပါရန်။';
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = 'လိုင်းမှားယွင်းပါရန်။';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error = 'လိုင်းသက်တမ်းကုန်ပါရန်။';
    statusCode = 401;
  }

  res.status(statusCode).json({
    error,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
