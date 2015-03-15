module.exports = {
  cache: true,
  entry: './src/index',
  output: {
    filename: 'browser-bundle.js'
  },
  module: {
    loaders: [
      {test: /\.js$|\.jsx$/, loader: 'jsx-loader'},
      {test: /\.json$/, loader: 'json-loader'}
    ]
  }
};
