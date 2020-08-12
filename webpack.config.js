const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const pkg = require('./package.json');

const outputDirectory = path.join(__dirname, 'dist');

module.exports = (env) =>{
  let mode = 'development';

  if (env && env.hasOwnProperty('NODE_ENV') && env.NODE_ENV === 'production') {
    mode = 'production';
  }

  console.log('Using', mode, 'settings.');

  return {
    mode: mode,
    devtool: 'inline-source-map',
    entry: './public/script.js',
    output: {
      path: outputDirectory,
      filename: 'bundle.js',
    },
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
  }
};
