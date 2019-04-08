const path = require('path');

module.exports = {
  entry: './src/index.jsx',
  mode: 'production',
  //devtool: 'cheap-eval-source-map',
  target: 'web',
  output: {
    filename: "bundle.js",
    publicPath: "/",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: ['.jsx', '.js']
  },
  module: {
    rules: [{
      test: /\.jsx?$/,
      use: {
        loader: 'babel-loader',
        options: {
          plugins: ['jsx-dom-expressions']
        }
      }
    }]
  }
}