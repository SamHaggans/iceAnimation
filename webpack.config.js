const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const outputDirectory = 'build';

module.exports = {
    devtool: 'eval-source-map',
    entry: ['babel-polyfill', './public/script.js'],
    output: {
        path: path.join(__dirname, outputDirectory),
        filename: 'bundle.js'
    },
    module: {
    rules: [{
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
        loader: 'babel-loader'
        }
    },
    {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
    },
    {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
    }]
    },
    resolve: {
        extensions: ['*', '.js', '.jsx']
    },
    devServer: {
        port: 3030,
        open: false,
        proxy: {
            '/api': 'http://localhost:3003'
        },
        historyApiFallback: true
    },
    plugins: [
        new CleanWebpackPlugin([outputDirectory]),
        new HtmlWebpackPlugin({
            template: './public/index.html'
        })
    ]
};