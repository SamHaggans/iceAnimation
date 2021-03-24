const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const pkg = require('./package.json');

const outputDirectory = path.join(__dirname, 'dist');

module.exports = {
  devtool: 'inline-source-map',
  entry: './public/script.js',
  output: {
    path: outputDirectory,
    filename: 'bundle.js',
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      loader: 'babel-loader',
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
  devServer: {
    port: 3030,
    contentBase: outputDirectory,
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new HtmlWebpackPlugin({
      template: './public/index.ejs',
      version: pkg.version,
    }),
  ],
};
