"use strict";

const path    = require("path");
const webpack = require("webpack");

const DEVEL = process.env.NODE_ENV === "development";

module.exports = {
    debug: DEVEL,
    devtool: DEVEL ? "#source-map" : "",
    context: __dirname,
    entry: {
        main: "./src/main.js",
    },
    output: {
        path      : path.resolve(__dirname, "app"),
        publicPath: "/",
        filename  : "build/js/[name].bundle.js",
        pathInfo  : DEVEL
    },
    externals: {
        "ace": true
    },
    plugins:
        DEVEL ? [] : [
            new webpack.optimize.OccurenceOrderPlugin(),
            new webpack.NoErrorsPlugin()
            // new webpack.optimize.UglifyJsPlugin()
        ],
    module: {
        loaders: []
    }
};
