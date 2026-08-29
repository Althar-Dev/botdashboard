const fs = require('fs');
const path = require('path');

const commandsPath = __dirname;

function registerCommandHandlers(bot, logger) {
  fs.readdirSync(commandsPath)
    .filter(file => file !== 'index.js' && file.endsWith('.js'))
    .forEach(file => {
      const handler = require(path.join(commandsPath, file));
      if (typeof handler === 'function') {
        handler(bot, logger);
      }
    });
}

module.exports = {
  registerCommandHandlers
};
