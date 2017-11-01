const path = require('path')
const webpack = require('webpack')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  entry: './src',
  devtool: 'source-map',
  devServer: {
    contentBase: './docs'
  },
  plugins: [
    new CleanWebpackPlugin(['docs']),
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new webpack.BannerPlugin({
      banner: `\tgenerated: ${new Date()}`,
      raw: false,
      entryOnly: true
    }),
    new ProgressBarPlugin(),
    new CaseSensitivePathsPlugin(),
    //new webpack.optimize.UglifyJsPlugin({
    //  sourceMap: true,
    //  compress: { warnings: true }
    //}),
  ],
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['react', 'stage-0']
        }
      },
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
      },
      {
        test: /\.scss$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'sass-loader' }]
      },
    ]
  },
  output: {
    path: path.join(__dirname, 'docs'),
    filename: 'bundle.js',
    publicPath: ''
  },
  //noParse: []
}
