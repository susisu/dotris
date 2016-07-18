/*
 * dotris / geom.js
 * copyright (c) 2016 Susisu
 */

"use strict";

export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class Rectangle {
    constructor(x, y, width, height) {
        this.x      = x;
        this.y      = y;
        this.width  = width;
        this.height = height;
    }
}

export class Color {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static fromInt(n) {
        return new Color(
            (n >>> 16) & 0xFF,
            (n >>> 8) & 0xFF,
            n & 0xFF,
            (n >>> 24) & 0xFF
        );
    }

    toInt() {
        return (this.a << 24) | (this.r << 16) | (this.g << 8) | this.b;
    }

    toCSSColor() {
        return `rgba(${this.r},${this.g},${this.b},${this.a / 255.0})`;
    }
}
