const chalk = require('chalk');

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatTimestamp() {
  const now = new Date();
  const day = pad(now.getDate());
  const hour = pad(now.getHours());
  const minute = pad(now.getMinutes());
  return `${day}:${hour}:${minute}`;
}

function typeColor(type) {
  switch (type) {
    case 'CMD':
    case 'MSG':
    case 'CALLBACK':
      return chalk.bgGreen.white.bold(` ${type} `);
    case 'INFO':
      return chalk.bgBlue.white.bold(` ${type} `);
    case 'ERROR':
      return chalk.bgRed.white.bold(` ${type} `);
    default:
      return chalk.bgWhite.black.bold(` ${type} `);
  }
}

function logBlock(type, name, form, usernameOrDetail, isError = false) {
  const timestamp = formatTimestamp();
  const prefix = chalk.cyan('╭──[');
  const arrow = chalk.cyan('\n╰─ ');
  const separator = chalk.cyan(']─[');
  const endBracket = chalk.cyan(']');
  const content = chalk.cyan(`${form} ─> ${usernameOrDetail}`);

  if (isError) {
    console.log(`${prefix}${typeColor(type)}${separator}${chalk.white(timestamp)}${endBracket}${arrow}${content}`);
    return;
  }

  console.log(`${prefix}${typeColor(type)}${separator}${chalk.white(name)}${separator}${chalk.white(timestamp)}${endBracket}${arrow}${content}`);
}

function command(name, form, username) {
  logBlock('CMD', name, form, username || 'unknown');
}

function message(name, form, username) {
  logBlock('MSG', name, form, username || 'unknown');
}

function callback(name, form, username) {
  logBlock('CALLBACK', name, form, username || 'unknown');
}

function info(detail, form = 'unknown') {
  logBlock('INFO', null, form, detail, true);
}

function error(detail, form = 'unknown') {
  logBlock('ERROR', null, form, detail, true);
}

module.exports = {
  command,
  message,
  callback,
  info,
  error
};
