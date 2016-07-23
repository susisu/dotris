/*
 * dotris / game.js
 * copyright (c) 2016 Susisu
 */

"use strict";

import { EventEmitter2 } from "eventemitter2";

import { Point, Rectangle, Color } from "./geom.js";
import { Bitmap } from "./bitmap.js";
import { Clock } from "./clock.js";

const BORDER_THICKNESS = 1;
const TOP_PADDING      = 6;

const BORDER_COLOR = new Color(255, 255, 255, 255);
const ERASE_COLOR  = new Color(0, 0, 0, 0);

export const BlockType = Object.freeze({
    I: "I",
    O: "O",
    S: "S",
    Z: "Z",
    J: "J",
    L: "L",
    T: "T"
});

const BLOCK_TYPES = Object.freeze([
    BlockType.I,
    BlockType.O,
    BlockType.S,
    BlockType.Z,
    BlockType.J,
    BlockType.L,
    BlockType.T
]);

export const BlockColorPrefix = Object.freeze({
    BLOCK: "block",
    GHOST: "ghost"
});

const BLOCK_EMPTY     = 0b000;
const BLOCK_EXISTS    = 0b001;
const BLOCK_SPIN      = 0b010;
const BLOCK_SPIN_MINI = 0b100;

const Block = (() => {
    const _ = BLOCK_EMPTY;
    const X = BLOCK_EXISTS;
    const O = BLOCK_SPIN;
    const A = BLOCK_SPIN_MINI;
    const B = BLOCK_SPIN | BLOCK_SPIN_MINI;
    return Object.freeze({
        [BlockType.I]: [
            [_, _, _, _],
            [X, X, X, X],
            [_, _, _, _],
            [_, _, _, _]
        ],
        [BlockType.O]: [
            [X, X],
            [X, X]
        ],
        [BlockType.S]: [
            [_, _, _, _, _],
            [_, B, X, X, O],
            [O, X, X, B, _],
            [_, _, _, _, _],
            [_, _, _, _, _]
        ],
        [BlockType.Z]: [
            [_, _, _, _, _],
            [O, X, X, B, _],
            [_, B, X, X, O],
            [_, _, _, _, _],
            [_, _, _, _, _]
        ],
        [BlockType.J]: [
            [X, B, B],
            [X, X, X],
            [O, _, O]
        ],
        [BlockType.L]: [
            [B, B, X],
            [X, X, X],
            [O, _, O]
        ],
        [BlockType.T]: [
            [O, X, O],
            [X, X, X],
            [O, A, O]
        ]
    });
})();

const BlockInitYOffset = Object.freeze({
    [BlockType.I]: -2,
    [BlockType.O]: -2,
    [BlockType.S]: -3,
    [BlockType.Z]: -3,
    [BlockType.J]: -2,
    [BlockType.L]: -2,
    [BlockType.T]: -2,
});

const BlockRotationDirection = Object.freeze({
    CLOCKWISE       : 0,
    COUNTERCLOCKWISE: 1
});

// BlockCorrection[blockType][rotationDegree][rotationDirection(clock/counter)][priority]
const BlockCorrection = (() => {
    const DEFAULT_RULE = Object.freeze([
        [
            [
                new Point(-1,  0),
                new Point(-1, -1),
                new Point( 0,  2),
                new Point(-1,  2)
            ],
            [
                new Point( 1,  0),
                new Point( 1, -1),
                new Point( 0,  2),
                new Point( 1,  2)
            ]
        ],
        [
            [
                new Point( 1,  0),
                new Point( 1,  1),
                new Point( 0, -2),
                new Point( 1, -2)
            ],
            [
                new Point( 1,  0),
                new Point( 1,  1),
                new Point( 0, -2),
                new Point( 1, -2)
            ]
        ],
        [
            [
                new Point( 1,  0),
                new Point( 1, -1),
                new Point( 0,  2),
                new Point( 1,  2)
            ],
            [
                new Point(-1,  0),
                new Point(-1, -1),
                new Point( 0,  2),
                new Point(-1,  2)
            ]
        ],
        [
            [
                new Point(-1,  0),
                new Point(-1,  1),
                new Point( 0, -2),
                new Point(-1, -2)
            ],
            [
                new Point(-1,  0),
                new Point(-1,  1),
                new Point( 0, -2),
                new Point(-1, -2)
            ]
        ]
    ]);
    const I_RULE = Object.freeze([
        [
            [
                new Point(-2,  0),
                new Point( 1,  0),
                new Point(-2,  1),
                new Point( 1, -2)
            ],
            [
                new Point(-1,  0),
                new Point( 2,  0),
                new Point(-1, -2),
                new Point( 2,  1)
            ]
        ],
        [
            [
                new Point(-1,  0),
                new Point( 2,  0),
                new Point(-1, -2),
                new Point( 2,  1)
            ],
            [
                new Point( 2,  0),
                new Point(-1,  0),
                new Point( 2, -1),
                new Point(-1,  2)
            ]
        ],
        [
            [
                new Point( 1,  0),
                new Point(-2,  0),
                new Point( 1,  2),
                new Point(-2, -1)
            ],
            [
                new Point( 2,  0),
                new Point(-1,  0),
                new Point( 2, -1),
                new Point(-1,  2)
            ]
        ],
        [
            [
                new Point( 1,  0),
                new Point(-2,  0),
                new Point( 1,  2),
                new Point(-2, -1)
            ],
            [
                new Point(-2,  0),
                new Point( 1,  0),
                new Point(-2,  1),
                new Point( 1, -2)
            ]
        ]
    ]);
    const T_RULE = Object.freeze([
        [
            [
                new Point(-1,  0),
                new Point(-1, -1),
                // new Point( 0,  2),
                new Point(-1,  2)
            ],
            [
                new Point( 1,  0),
                new Point( 1, -1),
                // new Point( 0,  2),
                new Point( 1,  2)
            ]
        ],
        [
            [
                new Point( 1,  0),
                new Point( 1,  1),
                new Point( 0, -2),
                new Point( 1, -2)
            ],
            [
                new Point( 1,  0),
                new Point( 1,  1),
                new Point( 0, -2),
                new Point( 1, -2)
            ]
        ],
        [
            [
                new Point( 1,  0),
                // new Point( 1, -1),
                new Point( 0,  2),
                new Point( 1,  2)
            ],
            [
                new Point(-1,  0),
                // new Point(-1, -1),
                new Point( 0,  2),
                new Point(-1,  2)
            ]
        ],
        [
            [
                new Point(-1,  0),
                new Point(-1,  1),
                new Point( 0, -2),
                new Point(-1, -2)
            ],
            [
                new Point(-1,  0),
                new Point(-1,  1),
                new Point( 0, -2),
                new Point(-1, -2)
            ]
        ]
    ]);
    return Object.freeze({
        [BlockType.I]: I_RULE,
        [BlockType.O]: DEFAULT_RULE,
        [BlockType.S]: DEFAULT_RULE,
        [BlockType.Z]: DEFAULT_RULE,
        [BlockType.J]: DEFAULT_RULE,
        [BlockType.L]: DEFAULT_RULE,
        [BlockType.T]: T_RULE
    });
})();

function deepCopyArray(arr) {
    let copy = [];
    for (let [i, e] of arr.entries()) {
        if (Array.isArray(e)) {
            copy[i] = deepCopyArray(e);
        }
        else {
            copy[i] = e;
        }
    }
    return copy;
}

function shuffleArray(arr) {
    let len = arr.length;
    for (let i = 0; i < len; i++) {
        let r = Math.floor(Math.random() * len);
        [arr[i], arr[r]] = [arr[r], arr[i]];
    }
    return arr;
}

function rotateMatrix(mat, direction) {
    let rows = mat.length;
    let cols = mat[0].length;
    if (rows === 0 || cols === 0) {
        throw new Error("invalid matrix");
    }
    let copy = [];
    for (let i = 0; i < cols; i++) {
        copy[i] = [];
    }
    if (direction === BlockRotationDirection.CLOCKWISE) {
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                copy[i][j] = mat[rows - 1 - j][i];
            }
        }
    }
    else {
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                copy[i][j] = mat[j][rows - 1 - i];
            }
        }
    }
    return copy;
}

export class Game extends EventEmitter2 {
    constructor(config) {
        super();
        this._innerWidth  = config.innerWidth;
        this._innerHeight = config.innerHeight;
        this._colors      = config.colors;

        this._fieldWidth  = this._innerWidth;
        this._fieldHeight = this._innerHeight + TOP_PADDING;
        this._width       = this._fieldWidth + BORDER_THICKNESS * 2;
        this._height      = this._fieldHeight + BORDER_THICKNESS * 2;

        this._canvas = window.document.createElement("canvas");
        this._canvas.width  = this._width;
        this._canvas.height = this._height;

        this._bmp = new Bitmap(this._canvas);
        this._initCanvas();

        this._over   = false;
        this._lines  = 0;
        this._score  = 0;
        this._clock  = new Clock(1.0);
        this._paused = true;

        this._block               = null;
        this._blockType           = undefined;
        this._blockWidth          = undefined;
        this._blockHeight         = undefined;
        this._blockRotationDegree = undefined;
        this._blockPosition       = undefined;
        this._ghostPosition       = undefined;

        this._nextBlockTypes = [];
        this._addNextBlockTypeSequence();
        this._addNextBlockTypeSequence();

        this._holdable        = true;
        this._holdedBlockType = undefined;

        this._lineCounter  = new Array(this._fieldHeight).fill(0);
        this._willLand     = false;
        this._lastMovement = undefined;
    }

    get innerWidth() {
        return this._innerWidth;
    }

    get innerHeight() {
        return this._innerHeight;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get topOffset() {
        return BORDER_THICKNESS + TOP_PADDING;
    }

    get bottomOffset() {
        return BORDER_THICKNESS;
    }

    get leftOffset() {
        return BORDER_THICKNESS;
    }

    get rightOffset() {
        return BORDER_THICKNESS;
    }

    get canvas() {
        return this._canvas;
    }

    _initCanvas() {
        // clear whole canvas
        this._bmp.fillRect(new Rectangle(0, 0, this.width, this.height), ERASE_COLOR);
        // draw borders
        this._bmp.fillRect(new Rectangle(              0,                0, this._width,            1), BORDER_COLOR);
        this._bmp.fillRect(new Rectangle(              0, this._height - 1, this._width,            1), BORDER_COLOR);
        this._bmp.fillRect(new Rectangle(              0,                0,           1, this._height), BORDER_COLOR);
        this._bmp.fillRect(new Rectangle(this._width - 1,                0,           1, this._height), BORDER_COLOR);
    }

    _debugDrawArea() {
        const AREA_COLOR    = new Color(255, 0, 0, 255);
        const PADDING_COLOR = new Color(0, 0, 255, 255);
        const EDGE_COLOR    = new Color(255, 255, 0, 255);

        this._bmp.fillRect(
            new Rectangle(BORDER_THICKNESS, BORDER_THICKNESS + TOP_PADDING, this._innerWidth, this._innerHeight),
            AREA_COLOR
        );
        this._bmp.fillRect(
            new Rectangle(BORDER_THICKNESS, BORDER_THICKNESS, this._innerWidth, TOP_PADDING),
            PADDING_COLOR
        );

        this._bmp.fillRect(
            new Rectangle(BORDER_THICKNESS, BORDER_THICKNESS + TOP_PADDING, this._innerWidth, 1),
            EDGE_COLOR
        );
        this._bmp.fillRect(
            new Rectangle(BORDER_THICKNESS, this._height - 1 - BORDER_THICKNESS, this._innerWidth, 1),
            EDGE_COLOR
        );
        this._bmp.fillRect(
            new Rectangle(BORDER_THICKNESS, BORDER_THICKNESS + TOP_PADDING, 1, this._innerHeight),
            EDGE_COLOR
        );
        this._bmp.fillRect(
            new Rectangle(this._width - 1 - BORDER_THICKNESS, BORDER_THICKNESS + TOP_PADDING, 1, this._innerHeight),
            EDGE_COLOR
        );
    }

    _drawBlock(position, color) {
        if (this._block !== null) {
            for (let j = 0; j < this._blockWidth; j++) {
                for (let i = 0; i < this._blockHeight; i++) {
                    if (this._block[i][j] & BLOCK_EXISTS !== 0) {
                        this._bmp.setPixel(Point.add(position, new Point(j, i)), color);
                    }
                }
            }
        }
    }

    _drawBlockGhost() {
        this._drawBlock(this._ghostPosition, this._colors[BlockColorPrefix.GHOST + this._blockType]);
        this._drawBlock(this._blockPosition, this._colors[BlockColorPrefix.BLOCK + this._blockType]);
    }

    _eraseBlockGhost() {
        this._drawBlock(this._blockPosition, ERASE_COLOR);
        this._drawBlock(this._ghostPosition, ERASE_COLOR);
    }

    _blockHitTest() {
        for (let j = 0; j < this._blockWidth; j++) {
            for (let i = 0; i < this._blockHeight; i++) {
                if (this._block[i][j] & BLOCK_EXISTS !== 0) {
                    let alpha = this._bmp.getAlpha(Point.add(this._blockPosition, new Point(j, i)));
                    if (alpha > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    _blockSpinTest() {
        let counter = 0;
        for (let j = 0; j < this._blockWidth; j++) {
            for (let i = 0; i < this._blockHeight; i++) {
                if (this._block[i][j] & BLOCK_SPIN !== 0) {
                    let alpha = this._bmp.getAlpha(Point.add(this._blockPosition, new Point(j, i)));
                    if (alpha > 0) {
                        counter++;
                    }
                }
            }
        }
        return counter >= 3;
    }

    _blockSpinMiniTest() {
        let counter = 0;
        for (let j = 0; j < this._blockWidth; j++) {
            for (let i = 0; i < this._blockHeight; i++) {
                if (this._block[i][j] & BLOCK_SPIN_MINI !== 0) {
                    let alpha = this._bmp.getAlpha(Point.add(this._blockPosition, new Point(j, i)));
                    if (alpha > 0) {
                        counter++;
                    }
                }
            }
        }
        if (this._blockType === BlockType.T) {
            return counter === 1;
        }
        else {
            return counter <= 1;
        }
    }

    start() {
        if (!this._over) {
            this._paused = false;
            this._clock.start();
        }
    }

    pause() {
        if (!this._over) {
            if (this._paused) {
                this._paused = false;
                this._clock.start();
            }
            else {
                this._paused = true;
                this._clock.stop();
            }
        }
    }
}
