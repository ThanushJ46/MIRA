require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const journalRoutes = require('./routes/journalRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend running',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString()
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/calendar', calendarRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
