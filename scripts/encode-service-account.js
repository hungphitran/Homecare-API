#!/usr/bin/env node
// Encode service_account.json to base64
// Usage:
//   node scripts/encode-service-account.js [inputPath] [outputPath]
// If outputPath is omitted the base64 string is printed to stdout.

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || path.join(__dirname, '..', 'service_account.json');
const outputPath = process.argv[3] || null;

try {
  const data = fs.readFileSync(inputPath);
  const b64 = Buffer.from(data).toString('base64');

  if (outputPath) {
    fs.writeFileSync(outputPath, b64, { encoding: 'utf8' });
    console.log(`Wrote base64 to ${outputPath}`);
  } else {
    console.log(b64);
  }
} catch (err) {
  console.error('Error reading or writing file:', err.message);
  process.exit(2);
}
