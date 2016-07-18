/*
 * dotris / game-manager.js
 * copyright (c) 2016 Susisu
 */

"use strict";

import { EventEmitter2 } from "eventemitter2";

import { Game } from "./game.js";

const WRAPPER_BORDER_THICKNESS = 1;

export class GameManager extends EventEmitter2 {
    constructor() {
        super();

        this._wrapper = window.document.getElementById("game-wrapper");

        this._wrapper.style.display = "none";
        this._enabled = false;

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
        this._wrapper.style.top  = `${(window.innerHeight - (this._height + WRAPPER_BORDER_THICKNESS * 2)) * 0.5}px`;
        this._wrapper.style.left = `${(window.innerWidth - (this._width + WRAPPER_BORDER_THICKNESS * 2)) * 0.5}px`;
    }

    _rescale(full) {
        if (this._scaling) {
            let scale = this._width / this._height >= window.innerWidth / window.innerHeight
                    ? window.innerWidth / this._width
                    : window.innerHeight / this._height;
            if (scale <= 0 || Number.isNaN(scale) || !Number.isFinite((scale))) {
                this._wrapper.style.transform = "none";
            }
            else {
                this._wrapper.style.transform = `scale(${scale},${scale})`;
            }
        }
        else if (full) {
            if (this._hiResolution) {
                let scale = 1.0 / (window.devicePixelRatio || 1.0);
                this._wrapper.style.transform = `scale(${scale},${scale})`;
            }
            else {
                this._wrapper.style.transform = "none";
            }
        }
    }

    show() {
        this._wrapper.style.display = "block";
        this._enabled = true;
    }

    hide() {
        this._wrapper.style.display = "none";
        this._enabled = false;
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