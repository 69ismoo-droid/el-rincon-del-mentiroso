import crypto from 'crypto';

const secret = crypto.randomBytes(64).toString('hex');
console.log('Tu SESSION_SECRET segura es:');
console.log(secret);
console.log('\nCopia y pega esto en tu archivo .env');
