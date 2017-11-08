const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/entry.js",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "bundle.js"
  },
  devServer: {
    contentBase: "./public"
  },
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }]
  },
  plugins: [
    new webpack.ProvidePlugin({
      THREE: "three"
    })
  ],
  devtool: "source-map"
};
