import * as path from 'path';
import * as url from 'url';
import { merge } from 'webpack-merge';
import webpack_common from './webpack.common.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default merge(webpack_common, {
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.(js|ts)$/i,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: 'last 2 Chrome versions'
                }
              ],
              '@babel/preset-typescript'
            ]
          }
        }
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                quietDeps: true
              }
            }
          }
        ],
      }
    ]
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
});
