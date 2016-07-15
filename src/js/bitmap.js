"use strict";

function endModule() {
    module.exports = Object.freeze({
        Bitmap
    });
}

const geom = require("./geom.js");

class Bitmap {
    constructor(canvas) {
        this.canvas = canvas;
        this._ctx   = canvas.getContext("2d");
    }

    getPixel(point) {
        let pixel = this._ctx.getImageData(point.x, point.y, 1, 1);
        return new geom.Color(
            pixel.data[0],
            pixel.data[1],
            pixel.data[2],
            pixel.data[3]
        );
    }

    setPixel(point, color) {
        let pixel = this._ctx.createImageData(1, 1);
        pixel.data[0] = color.r;
        pixel.data[1] = color.g;
        pixel.data[2] = color.b;
        pixel.data[3] = color.a;
        this._ctx.putImageData(pixel, point.x, point.y);
    }

    copyPixels(src, srcRect, distPoint) {
        this._ctx.save();
        this._ctx.globalCompositeOperation = "copy";
        this._ctx.imageSmoothingEnabled    = false;
        this._ctx.rect(distPoint.x, distPoint.y, srcRect.width, srcRect.height);
        this._ctx.clip();
        this._ctx.drawImage(
            src.canvas,
            srcRect.x, srcRect.y, srcRect.width, srcRect.height,
            distPoint.x, distPoint.y, srcRect.width, srcRect.height
        );
        this._ctx.restore();
    }
}

endModule();
