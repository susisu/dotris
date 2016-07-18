/*
 * dotris / main.js
 * copyright (c) 2016 Susisu
 */

"use strict";

import { Game } from "./game.js";

window.addEventListener("load", main);

function main() {
    window.removeEventListener("load", main);
    let gameConfig = {
        width : 10, // max: Math.floor(window.innerWidth * window.devicePixelRatio),
        height: 20  // max: Math.floor(window.innerHeight * window.devicePixelRatio)
    };
    let gameManager = new GameManager();
    gameManager.scaling = true;
    gameManager.start(gameConfig);
}

const GW_BORDER_THICKNESS = 1;

class GameManager {
    constructor() {
        this._wrapper = window.document.getElementById("game-wrapper");

        this._width  = 0;
        this._height = 0;

        this._game = null;

        this._scaling      = false;
        this._hiResolution = false;

        this._center();
        this._rescale(true);

        window.addEventListener("resize", () => {
            this._center();
            this._rescale(false);
        });
    }

    get scaling() {
        return this._scaling;
    }

    set scaling(val) {
        this._scaling = val;
        this._rescale(true);
    }

    get hiResolution() {
        return this._hiResolution;
    }

    set hiResolution(val) {
        this._hiResolution = val;
        this._rescale(true);
    }

    _center() {
        this._wrapper.style.top  = `${(window.innerHeight - (this._height + GW_BORDER_THICKNESS * 2)) * 0.5}px`;
        this._wrapper.style.left = `${(window.innerWidth - (this._width + GW_BORDER_THICKNESS * 2)) * 0.5}px`;
    }

    _rescale(full) {
        if (this._scaling) {
            let scale = this._width / this._height >= window.innerWidth / window.innerHeight
                    ? window.innerWidth / this._width
                    : window.innerHeight / this._height;
            this._wrapper.style.transform = `scale(${scale},${scale})`;
        }
        else if (full) {
            if (this._hiResolution) {
                let scale = 1.0 / window.devicePixelRatio;
                this._wrapper.style.transform = `scale(${scale},${scale})`;
            }
            else {
                this._wrapper.style.transform = "none";
            }
        }
    }

    start(config) {
        if (!this._game) {
            this._width  = config.width;
            this._height = config.height;

            this._wrapper.style.width  = `${this._width}px`;
            this._wrapper.style.height = `${this._height}px`;
            this._center();
            this._rescale(false);

            this._game = new Game(this._width, this._height, {});
            this._game.canvas.className  = "game-canvas";
            this._game.canvas.style.top  = `${-this._game.topOffset}px`;
            this._game.canvas.style.left = `${-this._game.leftOffset}px`;
            this._wrapper.appendChild(this._game.canvas);
        }
    }

    pause() {
        if (this._game) {
            // pause
        }
    }

    resume() {
        if (this._game) {
            // resume
        }
    }

    quit() {
        if (this._game) {
            // quit
        }
    }
}
