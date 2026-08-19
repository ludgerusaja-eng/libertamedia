// cPanel Phusion Passenger startup wrapper.
// Explicit CommonJS avoids package.json ESM semantics for Passenger's entrypoint.
const fs = require('node:fs');
const path = require('node:path');

const candidates = [
  path.join(__dirname, 'dist', 'server.cjs'),
  path.join(__dirname, 'server.cjs'),
];

const target = candidates.find((file) => fs.existsSync(file));
if (!target) {
  throw new Error('[cPanel Passenger] dist/server.cjs is missing. Deploy a successful production build first.');
}

try {
  const serverModule = require(target);
  const expressApp = serverModule && serverModule.default ? serverModule.default : serverModule;
  if (!expressApp) throw new Error('Production server did not export an application.');
  module.exports = expressApp;
} catch (error) {
  console.error('[cPanel Passenger] Failed to load production server:', error);
  throw error;
}
