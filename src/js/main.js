/*
 * dotris / main.js
 * copyright (c) 2016 Susisu
 */

"use strict";

import { TitleManager } from "./title-manager.js";
import { GameManager } from "./game-manager.js";

window.addEventListener("load", main);

function main() {
    window.removeEventListener("load", main);

    let title = new TitleManager();
    let game = new GameManager();

    title.show();
}
