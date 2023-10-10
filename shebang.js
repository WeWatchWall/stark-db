const fs = require('fs');

let file = fs.readFileSync('./dist/src/index.js', 'utf8');
const shebang = `#!/usr/bin/env node
`;

file = shebang + file;

fs.writeFileSync('./dist/src/index.js', file, 'utf8');