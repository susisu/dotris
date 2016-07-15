"use strict";

function endModule() {
    module.exports = Object.freeze({
        Point,
        Rectangle,
        Color
    });
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Rectangle {
    constructor(x, y, width, height) {
        this.x      = x;
        this.y      = y;
        this.width  = width;
        this.height = height;
    }
}

class Color {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    toCSSColor() {
        return `rgba(${this.r},${this.g},${this.b},${this.a / 255.0})`;
    }
}

endModule();
