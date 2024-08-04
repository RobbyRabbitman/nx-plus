// @ts-check
const jsConfig = require('./js.config');
const nxConfig = require('./nx.config');
const tsConfig = require('./ts.config');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [...nxConfig, ...jsConfig, ...tsConfig];
