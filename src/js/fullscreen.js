/*
 * dotris / fullscreen.js
 * copyright (c) 2016 Susisu
 */

"use strict";

export const FULL_SCREEN_ENABLED = !!(
    window.document.fullScreenEnabled
    || window.document.mozFullScreenEnabled
    || window.document.webkitFullscreenEnabled
);

export function requestFullscreen() {
    if (FULL_SCREEN_ENABLED) {
        let f = window.document.body.requestFullscreen
            || window.document.body.mozRequestFullScreen
            || window.document.body.webkitRequestFullscreen;
        if (typeof f === "function") {
            f.call(window.document.body);
        }
    }
}

export function isFullscreen() {
    if (FULL_SCREEN_ENABLED) {
        let elem = document.fullscreenElement
            || document.mozFullScreenElement
            || document.webkitFullscreenElement;
        return !!elem;
    }
    else {
        return false;
    }
}

export function exitFullscreen() {
    if (FULL_SCREEN_ENABLED) {
        let f = window.document.exitFullscreen
            || window.document.mozCancelFullScreen
            || window.document.webkitExitFullscreen;
        if (typeof f === "function") {
            f.call(window.document);
        }
    }
}

export function toggleFullscreen() {
    if (FULL_SCREEN_ENABLED) {
        if (isFullscreen()) {
            exitFullscreen();
        }
        else {
            requestFullscreen();
        }
    }
}
