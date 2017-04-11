/* eslint-env node */

"use strict";

const path    = require("path");
const webpack = require("webpack");

const IS_PRODUCTION = process.env.NODE_ENV === "production";

module.exports = {
  devtool: IS_PRODUCTION ? "" : "#source-map",
  context: __dirname,
  entry  : {
    main: ["babel-polyfill", "./src/js/main.js"]
  },
  output: {
    path      : path.resolve(__dirname, "app"),
    publicPath: "/",
    filename  : "build/js/[name].bundle.js",
    pathinfo  : !IS_PRODUCTION
  },
  plugins: IS_PRODUCTION
    ? [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.optimize.UglifyJsPlugin()
    ]
    : [
      new webpack.LoaderOptionsPlugin({ debug: !IS_PRODUCTION })
    ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use : {
          loader : "babel-loader",
          options: {
            presets: [
              ["env", {
                targets: {
                  browsers: "last 2 versions",
                  uglify  : true
                }
              }]
            ]
          }
        }
      }
    ]
  }
};
