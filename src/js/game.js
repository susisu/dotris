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

export class Game extends EventEmitter2 {
    constructor(innerWidth, innerHeight, option) {
        super();
        this._innerWidth  = innerWidth;
        this._innerHeight = innerHeight;

        this._width  = innerWidth + BORDER_THICKNESS * 2;
        this._height = innerHeight + BORDER_THICKNESS * 2 + TOP_PADDING;

        this._canvas = window.document.createElement("canvas");
        this._canvas.width  = this._width;
        this._canvas.height = this._height;

        this._bmp = new Bitmap(this._canvas);
        this._drawBorder();
        this._debugDrawArea();
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

    _drawBorder() {
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
}
