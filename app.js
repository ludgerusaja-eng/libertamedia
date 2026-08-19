// cPanel Phusion Passenger Startup File
// Fail fast: a broken production build must make Passenger fail visibly,
// rather than silently exporting an undefined application.
const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, 'dist', 'server.cjs'),
  path.join(__dirname, 'server.cjs'),
];

const target = candidates.find((file) => fs.existsSync(file));
if (!target) {
  throw new Error('[cPanel Passenger] dist/server.cjs is missing. Deploy a successful production build first.');
}

let serverModule;
try {
  serverModule = require(target);
} catch (error) {
  console.error('[cPanel Passenger] Failed to load production server:', error);
  throw error;
}

const expressApp = serverModule && serverModule.default ? serverModule.default : serverModule;
if (!expressApp) {
  throw new Error('[cPanel Passenger] Production server did not export an application.');
}

module.exports = expressApp;
