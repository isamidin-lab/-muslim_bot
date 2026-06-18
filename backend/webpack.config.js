module.exports = {
  entry: './src/main.ts', target: 'node', mode: 'development',
  module: { rules: [{ test: /\.ts$/, use: { loader: 'ts-loader', options: { transpileOnly: true } }, exclude: /node_modules/ }] },
  resolve: { extensions: ['.ts', '.js'] },
  output: { filename: 'main.js', path: require('path').resolve(__dirname, 'dist') },
};
