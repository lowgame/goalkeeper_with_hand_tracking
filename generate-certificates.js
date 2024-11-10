const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

// Generate self-signed certificates
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, {
    algorithm: 'sha256',
    days: 365,
    keySize: 2048,
});

// Create certificates directory if it doesn't exist
const certDir = path.join(__dirname, 'certificates');
if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir);
}

// Save private key
fs.writeFileSync(path.join(certDir, 'private-key.pem'), pems.private);
// Save certificate
fs.writeFileSync(path.join(certDir, 'certificate.pem'), pems.cert);

console.log('SSL certificates generated successfully!'); 