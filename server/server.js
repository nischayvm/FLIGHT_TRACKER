const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karnataka_tolls')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes
const tollRoutes = require('./routes/tolls');
app.use('/api/tolls', tollRoutes);

app.get('/', (req, res) => {
    res.send('Karnataka Tolls API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
