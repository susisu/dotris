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
    QUIT                   : 81, // q
    TOGGLE_VIEW            : 86, // v
    TOGGLE_FULLSCREEN      : 70  // f
});

const NUM_NEXT_BLOCKS  = 5;
const VIEW_BLOCKS_SIZE = 8;

const RANDOM_PAUSED_TEXTS = [
    "Game paused",
    "Hello",
    "Go ahead",
    "Try again",
    "Away from keyboard",
    "Wait a minute",
    "You reached the limit",
    "Gimme your voice",
    "Eat avocados",
    "Complex scalar field",
    "Many a little makes a mickle",
    "Stop right now",
    "Looks glitched to me"
];

function getPausedText(counter) {
    switch (counter) {
    case 0:
    case 1:
    case 2:
        return "Game paused";
    case 3:
        return "Game paused?";
    default:
        return RANDOM_PAUSED_TEXTS[Math.floor(Math.random() * RANDOM_PAUSED_TEXTS.length)];
    }
}

export class GameManager extends EventEmitter2 {
    constructor() {
        super();

        this._wrapper        = window.document.getElementById("game-wrapper");
        this._leftView       = window.document.getElementById("game-left-view");
        this._holdWrapper    = window.document.getElementById("game-hold");
        this._rightView      = window.document.getElementById("game-right-view");
        this._nextWrapper    = window.document.getElementById("game-next");
        this._linesText      = window.document.getElementById("game-lines");
        this._scoreText      = window.document.getElementById("game-score");
        this._levelText      = window.document.getElementById("game-level");
        this._messageText    = window.document.getElementById("game-message");
        this._pausedScreen   = window.document.getElementById("game-paused-screen");
        this._pausedText     = window.document.getElementById("game-paused-text");
        this._overScreen     = window.document.getElementById("game-over-screen");
        this._overResultText = window.document.getElementById("game-over-result");
        this._overShare      = window.document.getElementById("game-over-share");
        this._overBackButton = window.document.getElementById("game-over-back-button");

        this._visible = false;
        this._paused  = false;
        this._over    = true;
        this._updateVisibility();

        this._enabled = false;

        this._scaling        = false;
        this._highResolution = false;
        this._center();
        this._rescale(true);

        window.addEventListener("resize", () => {
            this._center();
            this._rescale(false);
        });

        this._viewOpacityLevel = 2;
        this._updateViewOpacity();

        this._width  = 0;
        this._height = 0;

        this._game = null;

        this._onGameScoreUpdate = data => {
            this._linesText.innerText = `Lines: ${data.lines}`;
            this._scoreText.innerText = `Score: ${data.score}`;
            this._levelText.innerText = `Level: ${data.level}`;
        };

        this._onGameMessage = message => {
            this._messageText.innerText = message;
        };

        this._onGameOver = () => {
            this._over = true;
            let resultText = `Size: ${this._width} x ${this._height}, `
                + `Lines: ${this._game.lines}, `
                + `Score: ${this._game.score}, `
                + `Level: ${this._game.level}`
                + (this._game.autoMode ? " (auto mode)" : "");
            this._overResultText.innerText = resultText;
            this._updateShareButtons(resultText + " - dotris");
            this._updateVisibility();
            this._overScreen.style.opacity = "1";
        };

        this._onKeyDown = event => {
            if (this._enabled) {
                event.preventDefault();
                this._keyboardControl(event.keyCode);
            }
        };

        this._overBackButton.addEventListener("click", () => {
            if (this._enabled && this._over) {
                this.quit();
            }
        });

        this._pauseCounter = 0;
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

    _updateVisibility() {
        if (this._visible) {
            if (this._over) {
                this._wrapper.style.display      = "block";
                this._leftView.style.display     = "block";
                this._rightView.style.display    = "block";
                this._pausedScreen.style.display = "none";
                this._overScreen.style.display   = "block";
            }
            else {
                if (this._paused) {
                    this._wrapper.style.display      = "none";
                    this._leftView.style.display     = "none";
                    this._rightView.style.display    = "none";
                    this._pausedScreen.style.display = "block";
                    this._overScreen.style.display   = "none";
                }
                else {
                    this._wrapper.style.display      = "block";
                    this._leftView.style.display     = "block";
                    this._rightView.style.display    = "block";
                    this._pausedScreen.style.display = "none";
                    this._overScreen.style.display   = "none";
                }
            }
        }
        else {
            this._wrapper.style.display      = "none";
            this._leftView.style.display     = "none";
            this._rightView.style.display    = "none";
            this._pausedScreen.style.display = "none";
            this._overScreen.style.display   = "none";
        }
    }

    _updateViewOpacity() {
        this._leftView.style.opacity   = `${this._viewOpacityLevel * 0.5}`;
        this._rightView.style.opacity  = `${this._viewOpacityLevel * 0.5}`;
        this._overScreen.style.opacity = `${this._viewOpacityLevel * 0.5}`;
    }

    _updateShareButtons(message) {
        while (this._overShare.firstChild) {
            this._overShare.removeChild(this._overShare.firstChild);
        }
        // twitter
        window.twttr.widgets.createShareButton(
            "",
            this._overShare,
            { text: message }
        );
    }

    show() {
        this._visible = true;
        this._updateVisibility();
        this._enabled = true;
    }

    hide() {
        this._enabled = false;
        this._visible = false;
        this._updateVisibility();
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
                innerWidth   : this._width,
                innerHeight  : this._height,
                colors       : colors,
                numNextBlocks: NUM_NEXT_BLOCKS,
                autoMode     : config.autoMode
            });

            this._game.canvas.className  = "game-canvas";
            this._game.canvas.style.top  = `${-this._game.topOffset}px`;
            this._game.canvas.style.left = `${-this._game.leftOffset}px`;
            this._wrapper.appendChild(this._game.canvas);

            this._game.nextCanvas.style.width  = `${this._game.nextCanvas.width * VIEW_BLOCKS_SIZE}px`;
            this._game.nextCanvas.style.height = `${this._game.nextCanvas.height * VIEW_BLOCKS_SIZE}px`;
            this._game.nextCanvas.style.backgroundColor = colors.background.toCSSColor();
            this._nextWrapper.appendChild(this._game.nextCanvas);

            this._game.holdCanvas.style.width  = `${this._game.holdCanvas.width * VIEW_BLOCKS_SIZE}px`;
            this._game.holdCanvas.style.height = `${this._game.holdCanvas.height * VIEW_BLOCKS_SIZE}px`;
            this._game.holdCanvas.style.backgroundColor = colors.background.toCSSColor();
            this._holdWrapper.appendChild(this._game.holdCanvas);

            this._linesText.innerText   = `Lines: ${this._game.lines}`;
            this._scoreText.innerText   = `Score: ${this._game.score}`;
            this._levelText.innerText   = `Level: ${this._game.level}`;
            this._messageText.innerText = "";
            
            this._paused = false;
            this._over   = false;
            this._updateVisibility();

            this._pauseCounter = 0;
            this._pausedText.innerText = getPausedText(this._pauseCounter);

            this._game.on("scoreUpdate", this._onGameScoreUpdate);
            this._game.on("message", this._onGameMessage);
            this._game.on("over", this._onGameOver);
            window.addEventListener("keydown", this._onKeyDown);
            this._game.start();
        }
    }

    pause() {
        if (this._game && !this._over) {
            this._game.pause();
            this._paused = !this._paused;
            if (this._paused) {
                this._pauseCounter++;
                this._pausedText.innerText = getPausedText(this._pauseCounter);
            }
            this._updateVisibility();
        }
    }

    quit() {
        if (this._game) {
            this._game.off("scoreUpdate", this._onGameScoreUpdate);
            this._game.off("message", this._onGameMessage);
            this._game.off("over", this._onGameOver);
            window.removeEventListener("keydown", this._onKeyDown);
            this._game.quit();
            this._paused = false;
            this._over   = true;
            this._wrapper.removeChild(this._game.canvas);
            this._nextWrapper.removeChild(this._game.nextCanvas);
            this._holdWrapper.removeChild(this._game.holdCanvas);
            this._game = null;
            this.emit("quit");
        }
    }

    _keyboardControl(keyCode) {
        if (this._game) {
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
                this.pause();
                break;
            case KeyCode.QUIT:
                if (this._paused) {
                    this.quit();
                }
                break;
            case KeyCode.TOGGLE_VIEW:
                this._viewOpacityLevel = (this._viewOpacityLevel + 1) % 3;
                this._updateViewOpacity();
                break;
            case KeyCode.TOGGLE_FULLSCREEN:
                toggleFullscreen();
                break;
            }
        }
    }
}
