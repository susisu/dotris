/*
 * dotris / clock.js
 * copyright (c) 2016 Susisu
 */

"use strict";

import { EventEmitter2 } from "eventemitter2";

const CLOCK_INTERVAL = 16;

export class Clock extends EventEmitter2 {
    constructor(frequency) {
        super();
        this._frequency  = frequency;
        this._total      = 0.0;
        this._oldTime    = undefined;
        this._intervalId = undefined;
        this._onTick     = () => {
            let now       = Date.now();
            let interval  = now - this._oldTime;
            this._oldTime = now;
            this._total  += interval / 1000.0;
            while (this._total >= 1.0 / this._frequency) {
                this._total -= 1.0 / this._frequency;
                this.emit("clock", now);
            }
        };
    }

    get frequency() {
        return this._frequency;
    }

    set frequency(val) {
        this._frequency = val;
        this.reset();
    }

    start() {
        this._oldTime    = Date.now();
        this._intervalId = window.setInterval(this._onTick, CLOCK_INTERVAL);
    }

    reset() {
        this._oldTime = Date.now();
        this._total   = 0.0;
    }

    stop() {
        window.clearInterval(this._intervalId);
    }
}
