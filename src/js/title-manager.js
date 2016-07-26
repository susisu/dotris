/*
 * dotris / title-manager.js
 * copyright (c) 2016 Susisu
 */

"use strict";

import { EventEmitter2 } from "eventemitter2";

import packageInfo from "../../package.json";

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

        this._titleScreen       = window.document.getElementById("title-screen");
        this._configForm        = window.document.getElementById("title-config-form");
        this._maximizeButton    = window.document.getElementById("title-maximize-button");
        this._playButton        = window.document.getElementById("title-play-button");
        this._autoModeButton    = window.document.getElementById("title-auto-mode-button");
        this._fullscreenButton  = window.document.getElementById("title-fullscreen-button");
        this._howToPlayButton   = window.document.getElementById("title-how-to-play-button");
        this._versionText       = window.document.getElementById("title-version-text");
        this._howToPlayScreen   = window.document.getElementById("how-to-play-screen");
        this._howToPlayOKButton = window.document.getElementById("how-to-play-ok-button");

        this._versionText.innerText = `v${packageInfo.version}`;

        this._visible          = false;
        this._visibleHowToPlay = false;
        this._updateVisibility();

        this._updateGameSizeConfig(true);

        this._enabled          = false;

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

        this._autoModeButton.addEventListener("click", () => {
            if (this._enabled) {
                this._playGame(true);
            }
        });

        this._fullscreenButton.addEventListener("click", () => {
            if (this._enabled) {
                toggleFullscreen();
            }
        });

        this._howToPlayButton.addEventListener("click", () => {
            if (this._enabled) {
                this._visibleHowToPlay = !this._visibleHowToPlay;
                this._updateVisibility();
            }
        });

        this._howToPlayOKButton.addEventListener("click", () => {
            if (this._enabled) {
                this._visibleHowToPlay = false;
                this._updateVisibility();
            }
        });
    }

    _updateVisibility() {
        if (this._visible) {
            this._titleScreen.style.display = "block";
            if (this._visibleHowToPlay) {
                this._howToPlayScreen.style.display = "block";
            }
            else {
                this._howToPlayScreen.style.display = "none";
            }
        }
        else {
            this._titleScreen.style.display     = "none";
            this._howToPlayScreen.style.display = "none";
        }
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

    _playGame(autoMode) {
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
            autoMode      : autoMode
        };
        this.emit("play", config);
    }

    show() {
        this._visible = true;
        this._updateVisibility();
        this._enabled = true;
    }

    hide() {
        this._visible          = false;
        this._visibleHowToPlay = false;
        this._updateVisibility();
        this._enabled = false;
    }
}
