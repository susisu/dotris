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
const FORBIDDEN_LINES  = 4;

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

const ASIDE_BLOCK_WIDTH  = 6;
const ASIDE_BLOCK_HEIGHT = 6;

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

const MovementType = Object.freeze({
    SPAWN : "spawn",
    MOVE  : "move",
    ROTATE: "rotate"
});

const MoveVector = Object.freeze({
    LEFT : new Point(-1, 0),
    RIGHT: new Point(1, 0),
    DOWN : new Point(0, 1)
});

export const GameMode = Object.freeze({
    STANDARD: "standard",
    ENDLESS : "endless",
    AUTO    : "auto"
});

const INIT_FREQUENCY         = 1.0;
const INIT_LAND_FREQUENCY    = 1.0;
const ENDLESS_MODE_FREQUENCY = 1.0;
const AUTO_MODE_FREQUENCY    = 60.0;

const MAX_LEVEL = 100;

function getFrequency(gameMode, level) {
    switch (gameMode) {
    case GameMode.STANDARD:
        return Math.min(level * 0.60 + INIT_FREQUENCY, 60.0);
    case GameMode.ENDLESS:
        return ENDLESS_MODE_FREQUENCY;
    case GameMode.AUTO:
        return AUTO_MODE_FREQUENCY;
    }
}

function getLandFrequency(gameMode, level) {
    switch (gameMode) {
    case GameMode.STANDARD:
        return Math.min(level * 0.03 + INIT_LAND_FREQUENCY, 4.0);
    case GameMode.ENDLESS:
        return ENDLESS_MODE_FREQUENCY;
    case GameMode.AUTO:
        return AUTO_MODE_FREQUENCY;
    }
}

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

function getClippedBlockRect(block) {
    let width  = block[0].length;
    let height = block.length;
    let left   = 0;
    let right  = width - 1;
    let top    = 0;
    let bottom = height - 1;
    for (let j = 0; j < width; j++) {
        let blockExists = false;
        for (let i = 0; i < height; i++) {
            if (block[i][j] & BLOCK_EXISTS !== 0) {
                blockExists = true;
                break;
            }
        }
        if (blockExists) {
            left = j;
            break;
        }
    }
    for (let j = width - 1; j >= 0; j--) {
        let blockExists = false;
        for (let i = 0; i < height; i++) {
            if (block[i][j] & BLOCK_EXISTS !== 0) {
                blockExists = true;
                break;
            }
        }
        if (blockExists) {
            right = j;
            break;
        }
    }
    for (let i = 0; i < height; i++) {
        let blockExists = false;
        for (let j = 0; j < height; j++) {
            if (block[i][j] & BLOCK_EXISTS !== 0) {
                blockExists = true;
                break;
            }
        }
        if (blockExists) {
            top = i;
            break;
        }
    }
    for (let i = height - 1; i >= 0; i--) {
        let blockExists = false;
        for (let j = 0; j < height; j++) {
            if (block[i][j] & BLOCK_EXISTS !== 0) {
                blockExists = true;
                break;
            }
        }
        if (blockExists) {
            bottom = i;
            break;
        }
    }
    return new Rectangle(left, top, right - left + 1, bottom - top + 1);
}

export class Game extends EventEmitter2 {
    constructor(config) {
        super();
        this._innerWidth    = config.innerWidth;
        this._innerHeight   = config.innerHeight;
        this._gameMode      = config.gameMode;
        this._colors        = config.colors;
        this._numNextBlocks = config.numNextBlocks;

        this._fieldWidth  = this._innerWidth;
        this._fieldHeight = this._innerHeight + TOP_PADDING;
        this._width       = this._fieldWidth + BORDER_THICKNESS * 2;
        this._height      = this._fieldHeight + BORDER_THICKNESS * 2;

        this._canvas = window.document.createElement("canvas");
        this._canvas.width  = this._width;
        this._canvas.height = this._height;
        this._bmp = new Bitmap(this._canvas);
        this._initCanvas();

        this._nextCanvas = window.document.createElement("canvas");
        this._nextCanvas.width  = ASIDE_BLOCK_WIDTH;
        this._nextCanvas.height = ASIDE_BLOCK_HEIGHT * this._numNextBlocks;
        this._nextBmp = new Bitmap(this._nextCanvas);

        this._holdCanvas = window.document.createElement("canvas");
        this._holdCanvas.width  = ASIDE_BLOCK_WIDTH;
        this._holdCanvas.height = ASIDE_BLOCK_HEIGHT;
        this._holdBmp = new Bitmap(this._holdCanvas);

        this._over   = false;
        this._lines  = 0;
        this._score  = 0;
        this._level  = 0;
        this._clock  = new Clock(getFrequency(this._gameMode, this._level));
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
        this._redrawNextBlocks();

        this._holdable        = true;
        this._holdedBlockType = undefined;
        this._redrawHoldedBlock();

        this._lineCounter  = new Array(this._fieldHeight).fill(0);
        this._lastMovement = undefined;
        this._backToBack   = false;

        this._spawNewBlock();
        this._clock.on("clock", () => {
            if (!this._over && !this._paused) {
                if (this._gameMode === GameMode.AUTO) {
                    this._hardDrop();
                }
                else {
                    this._clockDrop();
                }
            }
        });
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

    get nextCanvas() {
        return this._nextCanvas;
    }

    get holdCanvas() {
        return this._holdCanvas;
    }

    get gameMode() {
        return this._gameMode;
    }

    get paused() {
        return this._paused;
    }

    get over() {
        return this._over;
    }

    get lines() {
        return this._lines;
    }

    get score() {
        return this._score;
    }

    get level() {
        return this._level;
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

    _redrawNextBlocks() {
        this._nextBmp.fillRect(
            new Rectangle(0, 0, ASIDE_BLOCK_WIDTH, ASIDE_BLOCK_HEIGHT * this._numNextBlocks),
            ERASE_COLOR
        );
        for (let n = 0; n < this._numNextBlocks; n++) {
            let blockType = this._nextBlockTypes[n];
            let block     = Block[blockType];
            let rect      = getClippedBlockRect(block);
            let position  = new Point(
                Math.floor((ASIDE_BLOCK_WIDTH - rect.width) / 2),
                Math.floor((ASIDE_BLOCK_HEIGHT - rect.height) / 2) + ASIDE_BLOCK_HEIGHT * n
            );
            let color = this._colors[BlockColorPrefix.BLOCK + blockType];
            for (let j = rect.x; j < rect.x + rect.width; j++) {
                for (let i = rect.y; i < rect.y + rect.height; i++) {
                    if (block[i][j] & BLOCK_EXISTS !== 0) {
                        this._nextBmp.setPixel(Point.add(position, new Point(j - rect.x, i - rect.y)), color);
                    }
                }
            }
        }
    }

    _redrawHoldedBlock() {
        this._holdBmp.fillRect(new Rectangle(0, 0, ASIDE_BLOCK_WIDTH, ASIDE_BLOCK_HEIGHT), ERASE_COLOR);
        if (this._holdedBlockType !== undefined) {
            let block    = Block[this._holdedBlockType];
            let rect     = getClippedBlockRect(block);
            let position = new Point(
                Math.floor((ASIDE_BLOCK_WIDTH - rect.width) / 2),
                Math.floor((ASIDE_BLOCK_HEIGHT - rect.height) / 2)
            );
            let color = this._colors[BlockColorPrefix.BLOCK + this._holdedBlockType];
            for (let j = rect.x; j < rect.x + rect.width; j++) {
                for (let i = rect.y; i < rect.y + rect.height; i++) {
                    if (block[i][j] & BLOCK_EXISTS !== 0) {
                        this._holdBmp.setPixel(Point.add(position, new Point(j - rect.x, i - rect.y)), color);
                    }
                }
            }
        }
    }

    _updateBlockSize() {
        this._blockWidth  = this._block[0].length;
        this._blockHeight = this._block.length;
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
        if (this._lastMovement === MovementType.ROTATE) {
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
        else {
            return false;
        }
    }

    _blockSpinMiniTest() {
        if (this._lastMovement === MovementType.ROTATE) {
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
        else {
            return false;
        }
    }

    _willLand() {
        for (let j = 0; j < this._blockWidth; j++) {
            for (let i = this._blockHeight - 1; i >= 0; i--) {
                if (this._block[i][j] & BLOCK_EXISTS !== 0) {
                    let alpha = this._bmp.getAlpha(Point.add(this._blockPosition, new Point(j, i + 1)));
                    if (alpha > 0) {
                        return true;
                    }
                    break;
                }
            }
        }
        return false;
    }

    _getLandPosition() {
        let bottom = new Array(this._blockWidth).fill(-1);
        for (let j = 0; j < this._blockWidth; j++) {
            for (let i = this._blockHeight - 1; i >= 0; i--) {
                if (this._block[i][j] & BLOCK_EXISTS !== 0) {
                    bottom[j] = i;
                    break;
                }
            }
        }
        let minY = this._height;
        for (let j = 0; j < this._blockWidth; j++) {
            if (bottom[j] >= 0) {
                let alphas = this._bmp.getAlphasBelow(
                    new Point(this._blockPosition.x + j, this._blockPosition.y + bottom[j] + 1)
                );
                let len = alphas.length;
                for (let i = 0; i < len; i++) {
                    if (alphas[i] > 0) {
                        let y = this._blockPosition.y + i;
                        if (y < minY) {
                            minY = y;
                        }
                        break;
                    }
                }
            }
        }
        return new Point(this._blockPosition.x, minY);
    }

    _updateGhostPosition() {
        this._ghostPosition = this._getLandPosition();
    }

    _addNextBlockTypeSequence() {
        this._nextBlockTypes = this._nextBlockTypes.concat(shuffleArray(BLOCK_TYPES.slice()));
    }

    _shiftNextBlockType() {
        let blockType = this._nextBlockTypes.shift();
        if (this._nextBlockTypes.length <= BLOCK_TYPES.length) {
            this._addNextBlockTypeSequence();
        }
        this._redrawNextBlocks();
        return blockType;
    }

    _setCurrentBlock(blockType) {
        this._block = deepCopyArray(Block[blockType]);
        this._updateBlockSize();
        this._blockType           = blockType;
        this._blockRotationDegree = 0;
        if (this._gameMode === GameMode.AUTO) {
            let rect = getClippedBlockRect(this._block);
            this._blockPosition = new Point(
                BORDER_THICKNESS + Math.floor(Math.random() * (this._fieldWidth - rect.width)),
                BORDER_THICKNESS + TOP_PADDING + BlockInitYOffset[blockType]
            );
        }
        else {
            this._blockPosition = new Point(
                BORDER_THICKNESS + Math.floor((this._fieldWidth - this._blockWidth) / 2),
                BORDER_THICKNESS + TOP_PADDING + BlockInitYOffset[blockType]
            );
        }
    }

    _spawNewBlock() {
        if (this._block === null) {
            this._setCurrentBlock(this._shiftNextBlockType());

            this._holdable     = true;
            this._lastMovement = MovementType.SPAWN;

            if (this._blockHitTest()) {
                this.quit();
            }
            else {
                if (this._willLand()) {
                    this._clock.frequency = getLandFrequency(this._gameMode, this._level);
                }
                else {
                    this._clock.frequency = getFrequency(this._gameMode, this._level);
                }
                this._updateGhostPosition();
                this._drawBlockGhost();
            }
        }
    }

    _hold() {
        if (this._holdable) {
            this._eraseBlockGhost();
            if (this._holdedBlockType === undefined) {
                this._holdedBlockType = this._blockType;
                this._setCurrentBlock(this._shiftNextBlockType());
            }
            else {
                let blockType         = this._holdedBlockType;
                this._holdedBlockType = this._blockType;
                this._setCurrentBlock(blockType);
            }
            this._redrawHoldedBlock();

            this._holdable     = false;
            this._lastMovement = MovementType.SPAWN;

            if (this._blockHitTest()) {
                this.quit();
            }
            else {
                if (this._willLand()) {
                    this._clock.frequency = getLandFrequency(this._gameMode, this._level);
                }
                else {
                    this._clock.frequency = getFrequency(this._gameMode, this._level);
                }
                this._updateGhostPosition();
                this._drawBlockGhost();
            }
        }
    }

    _moveBlock(vector) {
        this._eraseBlockGhost();
        let wouldLand = this._willLand();
        let oldPosition     = this._blockPosition;
        this._blockPosition = Point.add(this._blockPosition, vector);
        if (this._blockHitTest()) {
            this._blockPosition = oldPosition;
            this._drawBlockGhost();
        }
        else {
            this._lastMovement = MovementType.MOVE;
            if (this._willLand()) {
                this._clock.frequency = getLandFrequency(this._gameMode, this._level);
            }
            else if (wouldLand) {
                this._clock.frequency = getFrequency(this._gameMode, this._level);
            }
            if (vector.x !== 0) {
                this._updateGhostPosition();
            }
            this._drawBlockGhost();
        }
    }

    _rotateBlock(direction) {
        this._eraseBlockGhost();
        let wouldLand = this._willLand();
        let oldBlock    = this._block;
        let oldPosition = this._blockPosition;
        this._block     = rotateMatrix(this._block, direction);
        this._updateBlockSize();
        let succeeded = false;
        if (this._blockHitTest()) {
            let corrs = BlockCorrection[this._blockType][this._blockRotationDegree][direction];
            for (let corr of corrs) {
                this._blockPosition = Point.add(oldPosition, corr);
                if (!this._blockHitTest()) {
                    succeeded = true;
                    break;
                }
            }
        }
        else {
            succeeded = true;
        }
        if (succeeded) {
            let directionPM           = direction === BlockRotationDirection.CLOCKWISE ? 1 : -1;
            this._blockRotationDegree = (this._blockRotationDegree + directionPM + 4) % 4;
            this._lastMovement = MovementType.ROTATE;
            if (this._willLand()) {
                this._clock.frequency = getLandFrequency(this._gameMode, this._level);
            }
            else if (wouldLand) {
                this._clock.frequency = getFrequency(this._gameMode, this._level);
            }
            this._updateGhostPosition();
            this._drawBlockGhost();
        }
        else {
            this._block = oldBlock;
            this._updateBlockSize();
            this._blockPosition = oldPosition;
            this._drawBlockGhost();
        }
    }

    _clockDrop() {
        this._eraseBlockGhost();
        if (this._willLand()) {
            this._landBlock();
        }
        else {
            let oldPosition     = this._blockPosition;
            this._blockPosition = Point.add(this._blockPosition, MoveVector.DOWN);
            if (this._blockHitTest()) {
                // won't come here
                this._blockPosition = oldPosition;
                this._landBlock();
            }
            else {
                if (this._willLand()) {
                    this._clock.frequency = getLandFrequency(this._gameMode, this._level);
                }
                else {
                    this._clock.frequency = getFrequency(this._gameMode, this._level);
                }
                this._lastMovement = MovementType.MOVE;
                this._drawBlockGhost();
            }
        }
    }

    _hardDrop() {
        this._eraseBlockGhost();
        let oldPosition     = this._blockPosition;
        this._blockPosition = this._getLandPosition();
        if (!Point.equal(oldPosition, this._blockPosition)) {
            this._lastMovement  = MovementType.MOVE;
        }
        this._landBlock();
    }

    _landBlock() {
        this._eraseBlockGhost();
        this._drawBlock(this._blockPosition, this._colors[BlockColorPrefix.BLOCK + this._blockType]);
        for (let j = 0; j < this._blockWidth; j++) {
            for (let i = 0; i < this._blockHeight; i++) {
                if (this._block[i][j] & BLOCK_EXISTS !== 0) {
                    this._lineCounter[this._blockPosition.y - BORDER_THICKNESS + i]++;
                }
            }
        }
        this._deleteLines();
        if (this._checkForbiddenLines()) {
            this._block = null;
            this._spawNewBlock();
        }
    }

    _deleteLines() {
        let spin     = this._blockSpinTest();
        let spinMini = this._blockSpinMiniTest();
        let minI = 0;
        for (let i = 0; i < this._fieldHeight; i++) {
            if (this._lineCounter[i] > 0) {
                minI = i;
                break;
            }
        }
        let deleteCounter = 0;
        for (let i = minI; i < this._fieldHeight; i++) {
            if (this._lineCounter[i] === this._fieldWidth) {
                this._bmp.copyPixels(
                    this._bmp,
                    new Rectangle(BORDER_THICKNESS, BORDER_THICKNESS + minI, this._fieldWidth, i - minI),
                    new Point(BORDER_THICKNESS, BORDER_THICKNESS + minI + 1)
                );
                this._bmp.fillRect(
                    new Rectangle(BORDER_THICKNESS, BORDER_THICKNESS + minI, this._fieldWidth, 1),
                    ERASE_COLOR
                );
                this._lineCounter.splice(i, 1);
                this._lineCounter.unshift(0);
                deleteCounter++;
            }
        }
        if (deleteCounter > 0) {
            let score = deleteCounter * deleteCounter * this._fieldWidth * 10;

            if (this._backToBack) {
                score *= 1.1;
            }
            let b2bText = this._backToBack ? "Back-To-Back " : "";

            switch (deleteCounter) {
            case 1:
                if (spin) {
                    if (spinMini) {
                        score *= 1.5;
                        this.emit("message", b2bText + this._blockType + "-Spin Mini");
                    }
                    else {
                        score *= 2;
                        this.emit("message", b2bText + this._blockType + "-Spin Single");
                    }
                    this._backToBack = true;
                }
                else {
                    this.emit("message", "");
                    this._backToBack = false;
                }
                break;
            case 2:
                if (spin) {
                    score *= 2;
                    this.emit("message", b2bText + this._blockType + "-Spin Double");
                    this._backToBack = true;
                }
                else {
                    this.emit("message", "Double");
                    this._backToBack = false;
                }
                break;
            case 3:
                if (spin) {
                    score *= 2;
                    this.emit("message", b2bText + this._blockType + "-Spin Triple");
                    this._backToBack = true;
                }
                else {
                    this.emit("message", "Triple");
                    this._backToBack = false;
                }
                break;
            case 4:
                this.emit("message", b2bText + "Quadruple");
                this._backToBack = true;
                break;
            }

            let perfect = true;
            for (let i = 0; i < this._fieldHeight; i++) {
                if (this._lineCounter[i] > 0) {
                    perfect = false;
                    break;
                }
            }
            if (perfect) {
                score += this._fieldWidth * this._fieldWidth * 100;
                this.emit("message", "Perfect Clear");
            }

            this._lines += deleteCounter;
            this._score += Math.floor(score);
            
            this._level = Math.min(Math.floor(this._lines / 20), MAX_LEVEL);

            this.emit("scoreUpdate", {
                lines: this._lines,
                score: this._score,
                level: this._level
            });
        }
    }

    _checkForbiddenLines() {
        for (let i = 0; i < FORBIDDEN_LINES; i++) {
            if (this._lineCounter[i] > 0) {
                this.quit();
                return false;
            }
        }
        return true;
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

    quit() {
        this._over = true;
        this._clock.stop();
        this.emit("over");
    }

    moveLeft() {
        if (!this._over && !this._paused && this._gameMode !== GameMode.AUTO) {
            this._moveBlock(MoveVector.LEFT);
        }
    }

    moveRight() {
        if (!this._over && !this._paused && this._gameMode !== GameMode.AUTO) {
            this._moveBlock(MoveVector.RIGHT);
        }
    }

    softDrop() {
        if (!this._over && !this._paused && this._gameMode !== GameMode.AUTO) {
            this._moveBlock(MoveVector.DOWN);
        }
    }

    hardDrop() {
        if (!this._over && !this._paused && this._gameMode !== GameMode.AUTO) {
            this._hardDrop();
        }
    }

    rotateClockwise() {
        if (!this._over && !this._paused && this._gameMode !== GameMode.AUTO) {
            this._rotateBlock(BlockRotationDirection.CLOCKWISE);
        }
    }

    rotateCounterclockwise() {
        if (!this._over && !this._paused && this._gameMode !== GameMode.AUTO) {
            this._rotateBlock(BlockRotationDirection.COUNTERCLOCKWISE);
        }
    }

    hold() {
        if (!this._over && !this._paused && this._gameMode !== GameMode.AUTO) {
            this._hold();
        }
    }
}
