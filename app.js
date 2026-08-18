// cPanel Phusion Passenger Startup File
const fs = require('fs');
const path = require('path');

const targetDist = path.join(__dirname, 'dist', 'server.cjs');
const targetRoot = path.join(__dirname, 'server.cjs');

if (fs.existsSync(targetDist)) {
  require(targetDist);
} else if (fs.existsSync(targetRoot)) {
  require(targetRoot);
} else {
  console.error('[cPanel Startup Error] Could not locate server.cjs in ./dist/server.cjs or ./server.cjs');
}
