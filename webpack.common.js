import * as path from "path";
import * as url from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";
import html_plugin_conf from "./webpack.html_plugin_conf.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: {
    index: path.resolve(__dirname, "src/ts/index.ts"),
  },
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "js/[name]-[contenthash].js",
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: {
          loader: "html-loader",
        },
      },
      {
        test: /\.(jpe?g|png|gif|webp|svg)$/,
        type: "asset/resource",
        generator: {
          filename: "afbeeldingen/[name]-[contenthash][ext][query]",
        },
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name]-[contenthash][ext][query]",
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      ...html_plugin_conf,
      filename: "index.html",
      chunks: ["index"],
      template: path.resolve(__dirname, "src/html/index.html"),
    }),
  ],
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@nieuwskaart": path.resolve(__dirname, "src/ts/lib"),
    },
  },
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
