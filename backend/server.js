const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure directories exist
fs.ensureDirSync(path.join(__dirname, 'data/pdfs'));
fs.ensureDirSync(path.join(__dirname, 'data/parsed'));

// Routes
app.use('/api', apiRoutes);

// Serve static files (PDFs)
app.use('/pdfs', express.static(path.join(__dirname, 'data/pdfs')));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Invoice Backend API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
