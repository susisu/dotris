/* eslint-env node */

"use strict";

const webpack              = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const notifier             = require("node-notifier");

const webpackConfig = require("./webpack.config.js");
const bundler       = webpack(webpackConfig);

const browserSync = require("browser-sync").create();

browserSync.init({
  server        : { baseDir: "app" },
  open          : false,
  logFileChanges: false,
  middleware    : [
    webpackDevMiddleware(bundler, {
      publicPath: webpackConfig.output.publicPath,
      stats     : { colors: true }
    })
  ],
  files: [
    "app/static/css/*.css",
    "app/*.html"
  ]
});

bundler.plugin("done", stats => {
  if (stats.hasErrors() || stats.hasWarnings()) {
    notifier.notify({
      title  : "webpack",
      message: `${stats.hash}\nFailed!`
    });
  }
  else {
    notifier.notify({
      title  : "webpack",
      message: `${stats.hash}\nSucceeded!`
    });
    browserSync.reload();
  }
});
