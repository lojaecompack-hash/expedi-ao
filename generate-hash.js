const bcrypt = require('bcryptjs');

const password = 'bruno0154';
const hash = bcrypt.hashSync(password, 10);

console.log('Senha:', password);
console.log('Hash:', hash);
