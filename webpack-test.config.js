const nodeExternals = require('webpack-node-externals');
const path = require('path');
const outputDirectory = path.join(__dirname, 'test-build');

module.exports = {
  mode: 'development',
  entry: './test.js',
  output: {
    path: outputDirectory,
    filename: 'testBundle.js',
  },
  target: 'node',
  externals: [nodeExternals()],
};
