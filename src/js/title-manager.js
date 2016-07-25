/*
 * dotris / title-manager.js
 * copyright (c) 2016 Susisu
 */

"use strict";

import { EventEmitter2 } from "eventemitter2";

import { toggleFullscreen } from "./fullscreen.js";

const GAME_MIN_WIDTH  = 10;
const GAME_MIN_HEIGHT = 20;

function forceInRange(x, min, max) {
    return x < min ? min
         : x > max ? max
         : x;
}

export class TitleManager extends EventEmitter2 {
    constructor() {
        super();

        this._wrapper = window.document.getElementById("title");

        this._wrapper.style.display = "none";
        this._enabled = false;

        this._configForm       = window.document.getElementById("config-form");
        this._maximizeButton   = window.document.getElementById("maximize-button");
        this._playButton       = window.document.getElementById("play-button");
        this._autoPlayButton   = window.document.getElementById("auto-play-button");
        this._fullscreenButton = window.document.getElementById("fullscreen-button");

        this._updateGameSizeConfig(true);

        window.addEventListener("resize", () => {
            this._updateGameSizeConfig(false);
        });

        this._configForm.addEventListener("change", () => {
            this._updateGameSizeConfig(false);
        });

        this._maximizeButton.addEventListener("click", () => {
            if (this._enabled) {
                this._configForm["width"].value  = `${this._gameMaxWidth}`;
                this._configForm["height"].value = `${this._gameMaxHeight}`;
            }
        });

        this._playButton.addEventListener("click", () => {
            if (this._enabled) {
                this._playGame(false);
            }
        });

        this._autoPlayButton.addEventListener("click", () => {
            if (this._enabled) {
                this._playGame(true);
            }
        });

        this._fullscreenButton.addEventListener("click", () => {
            if (this._enabled) {
                toggleFullscreen();
            }
        });
    }

    _updateGameSizeConfig(init) {
        if (init) {
            this._gameMinWidth  = GAME_MIN_WIDTH;
            this._gameMinHeight = GAME_MIN_HEIGHT;
            this._configForm["width"].min    = `${this._gameMinWidth}`;
            this._configForm["width"].value  = `${this._gameMinWidth}`;
            this._configForm["height"].min   = `${this._gameMinHeight}`;
            this._configForm["height"].value = `${this._gameMinHeight}`;
        }
        let ratio = this._configForm["high-resolution"].checked ? window.devicePixelRatio : 1.0;
        this._gameMaxWidth  = Math.floor(window.innerWidth * ratio);
        this._gameMaxHeight = Math.floor(window.innerHeight * ratio);
        this._configForm["width"].max  = `${this._gameMaxWidth}`;
        this._configForm["height"].max = `${this._gameMaxHeight}`;
    }

    _playGame(autoPlay) {
        let width = forceInRange(
            parseInt(this._configForm["width"].value) || 0,
            this._gameMinWidth, this._gameMaxWidth
        );
        let height = forceInRange(
            parseInt(this._configForm["height"].value) || 0,
            this._gameMinHeight, this._gameMaxHeight
        );
        this._configForm["width"].value  = width.toString();
        this._configForm["height"].value = height.toString();
        let config = {
            width         : width,
            height        : height,
            scaling       : this._configForm["scaling"].checked,
            highResolution: this._configForm["high-resolution"].checked,
            colorScheme   : this._configForm["color-scheme"].value,
            autoPlay      : autoPlay
        };
        this.emit("play", config);
    }

    show() {
        this._wrapper.style.display = "block";
        this._enabled = true;
    }

    hide() {
        this._wrapper.style.display = "none";
        this._enabled = false;
    }
}
