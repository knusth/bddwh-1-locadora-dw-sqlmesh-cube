/**
 * logger.js
 * utilitários de logging colorido com chalk.
 */

'use strict';

const chalk = require('chalk');

function info(msg) {
  console.log(chalk.blue('ℹ '), msg);
}

function success(msg) {
  console.log(chalk.green('✔ '), msg);
}

function warn(msg) {
  console.log(chalk.yellow('⚠ '), msg);
}

function error(msg) {
  console.error(chalk.red('✖ '), msg);
}

function dim(msg) {
  console.log(chalk.gray(msg));
}

module.exports = { info, success, warn, error, dim };
