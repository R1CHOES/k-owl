const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const metadataRoutes = require('./routes/metadataRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', metadataRoutes);
app.use('/api/users', userRoutes);

// Basic test route
app.get('/', (req, res) => {
    res.send('K-OWL API is running!');
});

// Only listen if the file is run directly (not when imported by Jest)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
// Export the app so Supertest can use it
module.exports = app;