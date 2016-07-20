/*
 * dotris / game-manager.js
 * copyright (c) 2016 Susisu
 */

"use strict";

import { EventEmitter2 } from "eventemitter2";

import { Color } from "./geom.js";
import { Game, BlockType } from "./game.js";
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
        background             : 0xFF000000,
        [`block${BlockType.I}`]: 0xFF40FFFF,
        [`block${BlockType.O}`]: 0xFFF0F020,
        [`block${BlockType.S}`]: 0xFF40F040,
        [`block${BlockType.Z}`]: 0xFFFFA0A0,
        [`block${BlockType.J}`]: 0xFF8080FF,
        [`block${BlockType.L}`]: 0xFFFFC000,
        [`block${BlockType.T}`]: 0xFFC060FF,
        [`ghost${BlockType.I}`]: 0x8040FFFF,
        [`ghost${BlockType.O}`]: 0x80F0F020,
        [`ghost${BlockType.S}`]: 0x8040F040,
        [`ghost${BlockType.Z}`]: 0x80FFA0A0,
        [`ghost${BlockType.J}`]: 0x808080FF,
        [`ghost${BlockType.L}`]: 0x80FFC000,
        [`ghost${BlockType.T}`]: 0x80C060FF
    }),
    grayscale: toColors({
        background             : 0xFF404040,
        [`block${BlockType.I}`]: 0xFFC0C0C0,
        [`block${BlockType.O}`]: 0xFFC0C0C0,
        [`block${BlockType.S}`]: 0xFFC0C0C0,
        [`block${BlockType.Z}`]: 0xFFC0C0C0,
        [`block${BlockType.J}`]: 0xFFC0C0C0,
        [`block${BlockType.L}`]: 0xFFC0C0C0,
        [`block${BlockType.T}`]: 0xFFC0C0C0,
        [`ghost${BlockType.I}`]: 0xFF808080,
        [`ghost${BlockType.O}`]: 0xFF808080,
        [`ghost${BlockType.S}`]: 0xFF808080,
        [`ghost${BlockType.Z}`]: 0xFF808080,
        [`ghost${BlockType.J}`]: 0xFF808080,
        [`ghost${BlockType.L}`]: 0xFF808080,
        [`ghost${BlockType.T}`]: 0xFF808080
    })
});

const KeyCode = Object.freeze({
    moveLeft              : 37, // left
    moveRight             : 39, // right
    moveDown              : 40, // down
    hardDrop              : 38, // up
    rotateClockwise       : 90, // z
    rotateCounterclockwise: 88, // x
    hold                  : 67, // c
    pause                 : 80, // p
    toggleView            : 86, // v
    toggleFullscreen      : 70  // f
});

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

        window.addEventListener("keydown", event => {
            if (this._enabled) {
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

    _keyboardControl(keyCode) {
        switch (keyCode) {
        case KeyCode.moveLeft:
            break;
        case KeyCode.moveRight:
            break;
        case KeyCode.moveDown:
            break;
        case KeyCode.hardDrop:
            break;
        case KeyCode.rotateClockwise:
            break;
        case KeyCode.rotateCounterclockwise:
            break;
        case KeyCode.hold:
            break;
        case KeyCode.pause:
            break;
        case KeyCode.toggleView:
            break;
        case KeyCode.toggleFullscreen:
            toggleFullscreen();
            break;
        }
    }
}
