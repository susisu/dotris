"use strict";

const webpack              = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const stripAnsi            = require("strip-ansi");

let webpackConfig = require("./webpack.config.js");
let bundler       = webpack(webpackConfig);

let browserSync = require("browser-sync").create();

browserSync.init({
    server: { baseDir: "app" },
    open: false,
    logFileChanges: false,
    middleware: [
        webpackDevMiddleware(bundler, {
            publicPath: webpackConfig.output.publicPath,
            stats     : { colors: true }
        })
    ],
    plugins: ["bs-fullscreen-message"],
    files: [
        "app/static/css/*.css",
        "app/*.html"
    ]
});

bundler.plugin("done", stats => {
    if (stats.hasErrors() || stats.hasWarnings()) {
        browserSync.sockets.emit("fullscreen:message", {
            title  : "Webpack Error:",
            body   : stripAnsi(stats.toString()),
            timeout: 100000
        });
        return;
    }
    browserSync.reload();
});
