const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 3000;

// SSL certificate options with correct path
const options = {
    key: fs.readFileSync(path.join(__dirname, 'certificates', 'private-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificates', 'certificate.pem'))
};

// Serve static files from the root directory
app.use(express.static(__dirname));

// Handle root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create HTTPS server
const server = https.createServer(options, app);

// Start server
server.listen(port, () => {
    console.log(`Goalkeeper game running at https://localhost:${port}`);
    console.log(`Server directory: ${__dirname}`);
    console.log(`Certificate path: ${path.join(__dirname, 'certificates', 'private-key.pem')}`);
});

// Error handling
server.on('error', (e) => {
    console.error('Server error:', e);
}); 