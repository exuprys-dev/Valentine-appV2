require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initDatabase = require('./init-db');

const app = express();
const PORT = process.env.PORT || 3001;

// Allow a specific origin in production. Set ALLOWED_ORIGIN to your Vercel URL (e.g. https://your-app.vercel.app)
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || '*',
};
app.use(cors(corsOptions));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

app.get('/', (req, res) => {
  res.send('Valentine API is running');
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });
