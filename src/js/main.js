/*
 * dotris / main.js
 * copyright (c) 2016 Susisu
 */

"use strict";

import { TitleManager } from "./title-manager.js";
import { GameManager } from "./game-manager.js";

window.addEventListener("load", main);

function main() {
    window.removeEventListener("load", main);

    let title = new TitleManager();
    let game  = new GameManager();

    title.once("play", onGamePlay);
    title.show();

    function onGamePlay(config) {
        title.hide();

        game.scaling        = config.scaling;
        game.highResolution = config.highResolution;

        game.once("quit", onGameQuit);
        game.show();
        game.start({
            width      : config.width,
            height     : config.height,
            gameMode   : config.gameMode,
            colorScheme: config.colorScheme
        });
    }

    function onGameQuit() {
        game.hide();

        title.once("play", onGamePlay);
        title.show();
    }
}
