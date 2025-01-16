import {merge} from 'webpack-merge';
import webpack_config_production from './webpack.production.js';

export default merge(
  webpack_config_production,
  {
    devtool: 'inline-source-map'
  }
);
