/*
 * dotris / game-manager.js
 * copyright (c) 2016 Susisu
 */

"use strict";

import { EventEmitter2 } from "eventemitter2";

import { Color } from "./geom.js";
import { Game, BlockType, BlockColorPrefix } from "./game.js";
import { toggleFullscreen } from "./fullscreen.js";

const WRAPPER_BORDER_THICKNESS = 1;

function toColors(obj) {
    let colors = {};
    for (let key in obj) {
        colors[key] = Color.fromInt(obj[key]);
    }
    return colors;
}

const ColorScheme = Object.freeze({
    standard: toColors({
        background                            : 0xFF000000,
        [BlockColorPrefix.BLOCK + BlockType.I]: 0xFF40FFFF,
        [BlockColorPrefix.BLOCK + BlockType.O]: 0xFFF0F020,
        [BlockColorPrefix.BLOCK + BlockType.S]: 0xFF40F040,
        [BlockColorPrefix.BLOCK + BlockType.Z]: 0xFFFFA0A0,
        [BlockColorPrefix.BLOCK + BlockType.J]: 0xFF8080FF,
        [BlockColorPrefix.BLOCK + BlockType.L]: 0xFFFFC000,
        [BlockColorPrefix.BLOCK + BlockType.T]: 0xFFC060FF,
        [BlockColorPrefix.GHOST + BlockType.I]: 0x8040FFFF,
        [BlockColorPrefix.GHOST + BlockType.O]: 0x80F0F020,
        [BlockColorPrefix.GHOST + BlockType.S]: 0x8040F040,
        [BlockColorPrefix.GHOST + BlockType.Z]: 0x80FFA0A0,
        [BlockColorPrefix.GHOST + BlockType.J]: 0x808080FF,
        [BlockColorPrefix.GHOST + BlockType.L]: 0x80FFC000,
        [BlockColorPrefix.GHOST + BlockType.T]: 0x80C060FF
    }),
    grayscale: toColors({
        background                            : 0xFF404040,
        [BlockColorPrefix.BLOCK + BlockType.I]: 0xFFF0F0F0,
        [BlockColorPrefix.BLOCK + BlockType.O]: 0xFFF0F0F0,
        [BlockColorPrefix.BLOCK + BlockType.S]: 0xFFF0F0F0,
        [BlockColorPrefix.BLOCK + BlockType.Z]: 0xFFF0F0F0,
        [BlockColorPrefix.BLOCK + BlockType.J]: 0xFFF0F0F0,
        [BlockColorPrefix.BLOCK + BlockType.L]: 0xFFF0F0F0,
        [BlockColorPrefix.BLOCK + BlockType.T]: 0xFFF0F0F0,
        [BlockColorPrefix.GHOST + BlockType.I]: 0xFF808080,
        [BlockColorPrefix.GHOST + BlockType.O]: 0xFF808080,
        [BlockColorPrefix.GHOST + BlockType.S]: 0xFF808080,
        [BlockColorPrefix.GHOST + BlockType.Z]: 0xFF808080,
        [BlockColorPrefix.GHOST + BlockType.J]: 0xFF808080,
        [BlockColorPrefix.GHOST + BlockType.L]: 0xFF808080,
        [BlockColorPrefix.GHOST + BlockType.T]: 0xFF808080
    })
});

const KeyCode = Object.freeze({
    MOVE_LEFT              : 37, // left
    MOVE_RIGHT             : 39, // right
    SOFT_DROP              : 40, // down
    HARD_DROP              : 38, // up
    ROTATE_CLOCKWISE       : 90, // z
    ROTATE_COUNTERCLOCKWISE: 88, // x
    HOLD                   : 67, // c
    PAUSE                  : 80, // p
    TOGGLE_VIEW            : 86, // v
    TOGGLE_FULLSCREEN      : 70  // f
});

export class GameManager extends EventEmitter2 {
    constructor() {
        super();

        this._wrapper   = window.document.getElementById("game-wrapper");
        this._leftView  = window.document.getElementById("game-left-view");
        this._rightView = window.document.getElementById("game-right-view");

        this._wrapper.style.display   = "none";
        this._leftView.style.display  = "none";
        this._rightView.style.display = "none";
        this._enabled = false;

        this._viewOpacityLevel = 2;
        this._leftView.style.opacity  = `${this._viewOpacityLevel * 0.5}`;
        this._rightView.style.opacity = `${this._viewOpacityLevel * 0.5}`;

        this._width  = 0;
        this._height = 0;

        this._game = null;

        this._scaling        = false;
        this._highResolution = false;

        this._center();
        this._rescale(true);

        window.addEventListener("resize", () => {
            this._center();
            this._rescale(false);
        });

        window.addEventListener("keydown", event => {
            if (this._enabled) {
                event.preventDefault();
                this._keyboardControl(event.keyCode);
            }
        });
    }

    get scaling() {
        return this._scaling;
    }

    set scaling(val) {
        this._scaling = val;
        this._rescale(true);
    }

    get highResolution() {
        return this._highResolution;
    }

    set highResolution(val) {
        this._highResolution = val;
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
            if (this._highResolution) {
                let scale = 1.0 / (window.devicePixelRatio || 1.0);
                this._wrapper.style.transform = `scale(${scale},${scale})`;
            }
            else {
                this._wrapper.style.transform = "none";
            }
        }
    }

    show() {
        this._wrapper.style.display   = "block";
        this._leftView.style.display  = "block";
        this._rightView.style.display = "block";
        this._enabled = true;
    }

    hide() {
        this._wrapper.style.display   = "none";
        this._leftView.style.display  = "none";
        this._rightView.style.display = "none";
        this._enabled = false;
    }

    start(config) {
        if (!this._game) {
            this._width  = config.width;
            this._height = config.height;

            let colors = ColorScheme[config.colorScheme] || ColorScheme.standard;

            this._wrapper.style.width           = `${this._width}px`;
            this._wrapper.style.height          = `${this._height}px`;
            this._wrapper.style.backgroundColor = colors.background.toCSSColor();

            this._center();
            this._rescale(false);

            this._game = new Game({
                innerWidth : this._width,
                innerHeight: this._height,
                colors     : colors
            });
            this._game.canvas.className  = "game-canvas";
            this._game.canvas.style.top  = `${-this._game.topOffset}px`;
            this._game.canvas.style.left = `${-this._game.leftOffset}px`;
            this._wrapper.appendChild(this._game.canvas);

            this._game.start();
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

    _toggleView() {
        this._viewOpacityLevel = (this._viewOpacityLevel + 1) % 3;
        this._leftView.style.opacity  = `${this._viewOpacityLevel * 0.5}`;
        this._rightView.style.opacity = `${this._viewOpacityLevel * 0.5}`;
    }

    _keyboardControl(keyCode) {
        switch (keyCode) {
        case KeyCode.MOVE_LEFT:
            this._game.moveLeft();
            break;
        case KeyCode.MOVE_RIGHT:
            this._game.moveRight();
            break;
        case KeyCode.SOFT_DROP:
            this._game.softDrop();
            break;
        case KeyCode.HARD_DROP:
            this._game.hardDrop();
            break;
        case KeyCode.ROTATE_CLOCKWISE:
            this._game.rotateClockwise();
            break;
        case KeyCode.ROTATE_COUNTERCLOCKWISE:
            this._game.rotateCounterclockwise();
            break;
        case KeyCode.HOLD:
            this._game.hold();
            break;
        case KeyCode.PAUSE:
            this._game.pause();
            break;
        case KeyCode.TOGGLE_VIEW:
            this._toggleView();
            break;
        case KeyCode.TOGGLE_FULLSCREEN:
            toggleFullscreen();
            break;
        }
    }
}
