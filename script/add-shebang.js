const fs = require('fs');
const filePath = './dist/src/index.js';
const shebang = '#!/usr/bin/env node\n';

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  if (!data.startsWith(shebang)) {
    const updatedData = shebang + data;
    fs.writeFile(filePath, updatedData, 'utf8', (err) => {
      if (err) {
        console.error(err);
      }
    });
  }
});
