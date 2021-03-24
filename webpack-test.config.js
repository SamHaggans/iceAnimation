const path = require('path');
const outputDirectory = path.join(__dirname, 'test-build');

module.exports = {
  mode: 'development',
  entry: './test/test.js',
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
    },
    {
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    },
    {
      test: /\.(jpe?g|png|gif|svg)$/,
      loader: 'file-loader',
    }],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  output: {
    path: outputDirectory,
    filename: 'testBundle.js',
  },
};
