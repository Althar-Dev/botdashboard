const fs = require('fs');
const path = require('path');

const callbacksPath = __dirname;

function registerCallbackHandlers(bot, logger) {
  fs.readdirSync(callbacksPath)
    .filter(file => file !== 'index.js' && file.endsWith('.js'))
    .forEach(file => {
      const handler = require(path.join(callbacksPath, file));
      if (typeof handler === 'function') {
        handler(bot, logger);
      }
    });
}

module.exports = {
  registerCallbackHandlers
};
