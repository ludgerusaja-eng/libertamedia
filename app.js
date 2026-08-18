// cPanel Phusion Passenger Startup File
const fs = require('fs');
const path = require('path');

let serverModule = null;
const targetDist = path.join(__dirname, 'dist', 'server.cjs');
const targetRoot = path.join(__dirname, 'server.cjs');

try {
  if (fs.existsSync(targetDist)) {
    serverModule = require(targetDist);
  } else if (fs.existsSync(targetRoot)) {
    serverModule = require(targetRoot);
  } else {
    console.error('[cPanel Startup Error] Could not locate server.cjs in ./dist/server.cjs or ./server.cjs');
  }
} catch (err) {
  console.error('[cPanel Passenger Startup Failure]:', err);
}

const expressApp = (serverModule && serverModule.default) ? serverModule.default : serverModule;

module.exports = expressApp;
