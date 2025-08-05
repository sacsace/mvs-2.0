const jwt = require('jsonwebtoken');
const fs = require('fs');

// Read the JWT secret from config
const configPath = './src/config/config.json';
let jwtSecret = 'your-secret-key'; // default

try {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    jwtSecret = config.jwt_secret || jwtSecret;
  }
} catch (error) {
  console.log('Using default JWT secret');
}

// Function to decode JWT token
function decodeToken(token) {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    console.error('JWT decode error:', error.message);
    return null;
  }
}

// Check if there's a token in the request or provide instructions
console.log('=== JWT Token Decoder ===');
console.log('To check the current user, you need to:');
console.log('1. Open the browser developer tools');
console.log('2. Go to Application/Storage tab');
console.log('3. Look for localStorage');
console.log('4. Find the "token" key');
console.log('5. Copy the token value');
console.log('');
console.log('Then run this script with the token as an argument:');
console.log('node check_current_user.js <your-jwt-token>');
console.log('');

// If token is provided as argument
if (process.argv[2]) {
  const token = process.argv[2];
  console.log('Decoding token...');
  const decoded = decodeToken(token);
  
  if (decoded) {
    console.log('=== Decoded User Information ===');
    console.log('User ID:', decoded.id);
    console.log('Username:', decoded.username);
    console.log('Role:', decoded.role);
    console.log('Company ID:', decoded.company_id);
    console.log('Full decoded data:', JSON.stringify(decoded, null, 2));
  }
} else {
  console.log('No token provided. Please provide a JWT token as an argument.');
} 