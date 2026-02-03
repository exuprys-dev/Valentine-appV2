require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDatabase = require('./init-db');

const app = express();
const PORT = process.env.PORT || 3001;

// Allow a specific origin in production. Set ALLOWED_ORIGIN to your Vercel URL (e.g. https://your-app.vercel.app)
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || '*',
};
app.use(cors(corsOptions));
app.use(express.json());

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
