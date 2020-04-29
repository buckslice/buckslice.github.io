// todo
// astar / other algo support
// maybe try adding circles for nodes that change colors depending on if they are closed / open
// make path length calc diagonals correctly
// add zoom in and out capability (lets you have super huge maps this way!!!)
// calc 2 second path drawer like the other path and gen await functions to work properly
//      otherwise its still way too slow on large mazes to do lost sleep time
// add line grid draw tool so users can make their own designs easier
//      add little outline square selector showing what grid postion they are on
//      also undo and redo maybe
// maybe draw circle under currently opened node or something. then have to redraw neighbors blech
// add bias slider for depth first maze, horizontal or vertical bias
// redo everything to use HSB color mode
// make the draw functions not retardode
// try green to red for path coloring

//code.iamkate.com
function Queue() { var a = [], b = 0; this.getLength = function () { return a.length - b }; this.isEmpty = function () { return 0 == a.length }; this.enqueue = function (b) { a.push(b) }; this.dequeue = function () { if (0 != a.length) { var c = a[b]; 2 * ++b >= a.length && (a = a.slice(b), b = 0); return c } }; this.peek = function () { return 0 < a.length ? a[b] : void 0 } };
function shiffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const FLOOR = 0;
const WALL = 1;
const VISITED = 2;
const SELECT = 3;
const BACKTRACK = 4;
const SELECT2 = 5; // dont ask

const LEFTMOUSE = 0;
const RIGHTMOUSE = 2;

class PathNode {
    constructor(x, y, parent) {
        this.x = x;
        this.y = y;
        this.parent = parent;
    }

    hash() { // perfect hash in range to 0 -> 65535
        return this.y << 16 | this.x;
        //return this.x + ',' + this.y;
    }
}

function bhash(x, y) {
    return y << 16 | x;
    //return this.x + ',' + this.y;
}

let GRID_SIZE = 12;
let LINE_WIDTH;

let options = {}
options.pathInstant = false;
options.pathMsPerOp = 1000.0 / 100;
options.genInstant = false;
options.genMsPerOp = 1.0;

let canvas;
const canvasWidth = window.innerWidth - 160;
const canvasHeight = window.innerHeight;
const TARGET_FRAME_RATE = 120;

// try to set grid based on max screen height
let GRIDX, GRIDY;
let origX, origY;
let pixOffXOdd, pixOffYOdd, pixOffXEven, pixOffYEven;
let pathStartX, pathStartY, pathEndX, pathEndY; // tracks first and second pathfinding points
let _operating = false; // finding a path or generating a grid
let gridDirty = false; // gets set when a path is drawn on grid

let drawLineToParentPath;

let backgroundColor = 51; // 255 for other mazo
const pathColor = "#FFFF00";
const wallColor = 150;


let _cancel = false;
let _ops = 0; // current ops counter
let _opfAllowance = 0;
let _msAccum = 0;
let _lastFrameTime = 0;
let _startTime;
let _opsText; // current ops text
let _timeTakenText;
let _msPerOpStr; // option lookup

// init grid
let grid, frontier;
function initGrid() {
    _operating = false;
    _cancel = true;

    grid = [];
    //frontier = [];
    frontier = new Queue();
    LINE_WIDTH = Math.floor(GRID_SIZE / 8.0) + 1;
    if (LINE_WIDTH % 2 == 0) {
        drawLineToParentPath = (n) => {
            line(n.x * GRID_SIZE + pixOffXEven,
                n.y * GRID_SIZE + pixOffYEven,
                n.parent.x * GRID_SIZE + pixOffXEven,
                n.parent.y * GRID_SIZE + pixOffYEven);
        }
    } else {
        drawLineToParentPath = (n) => {
            line(n.x * GRID_SIZE + pixOffXOdd,
                n.y * GRID_SIZE + pixOffYOdd,
                n.parent.x * GRID_SIZE + pixOffXOdd,
                n.parent.y * GRID_SIZE + pixOffYOdd);
        }
    }

    clearPathUI();
    clearGenUI();

    // GRIDX = 200; // width of grid
    // GRIDY = 100; // height of grid
    GRIDX = Math.floor((canvasWidth - 1) / GRID_SIZE);
    GRIDY = Math.floor((canvasHeight - 1) / GRID_SIZE);
    gridDimsText.innerHTML = `${GRIDX}x${GRIDY}`
    //console.log('grid ' + GRIDX + ',' + GRIDY);
    // origX = Math.floor(canvasWidth / 2 - GRIDX * GRID_SIZE / 2) - 1.5;
    // origY = Math.floor(canvasHeight / 2 - GRIDY * GRID_SIZE / 2) - 1.5;
    //origX = origY = 0.5;
    origX = origY = 0.5;

    // based off grid (only want to round the line if the stroke is even numbered???)
    pixOffXEven = Math.floor(origX + GRID_SIZE / 2.0);
    pixOffYEven = Math.floor(origY + GRID_SIZE / 2.0);
    pixOffXOdd = pixOffXEven - 0.5;
    pixOffYOdd = pixOffYEven - 0.5;
    // console.log(pixOffXOdd + " " + pixOffYOdd);
    // console.log(pixOffXEven + " " + pixOffYEven);

    pathStartX = pathStartY = pathEndX = pathEndY = -1;

    // tighten up on the current grid_size settings
    resizeCanvas(GRIDX * GRID_SIZE + 1, GRIDY * GRID_SIZE + 1);

    for (let y = 0; y < GRIDY; y++) {
        grid.push(new Array(GRIDX).fill(FLOOR));
    }

    drawBackground();
}
//console.log(grid);

function setup() {

    // Sets the screen to be 720 pixels wide and 400 pixels high
    canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('main')
    //pixelDensity(2.)
    frameRate(TARGET_FRAME_RATE);
    noSmooth(); // might not be doing anything, more important to make sure pixel positions are rounded

    //strokeCap(SQUARE);// SQUARE, also PROJECT if gaps maybe

    stroke(255);
    fill(255);

    initGrid();
    genGrid();
}


function safeset(x, y, g) {
    if (x < 0 || x >= GRIDX || y < 0 || y >= GRIDY) {
        return;
    }
    grid[y][x] = g;
    drawOnGrid(x, y, g);
}
function saferedraw(x, y) {
    if (x < 0 || x >= GRIDX || y < 0 || y >= GRIDY) {
        return;
    }
    drawGridSquare(x, y);
}

function getStrSeed(length) {
    let rng = new Math.seedrandom(); // auto seed
    let res = '';
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charLen = chars.length;
    for (let i = 0; i < length; ++i) {
        res += chars.charAt(Math.floor(rng() * charLen));
    }
    return res;
}

async function _wait() {
    _opsText.innerHTML = _ops;
    while (_opfAllowance <= 0) {
        _setTimeTakenText();
        _lastFrameTime = performance.now();
        await new Promise(resolve => { setTimeout(resolve, 0) }); // wait one frame
        if (_cancel) {
            return false;
        }
        // calculate new ops per frame
        _msAccum += performance.now() - _lastFrameTime;
        let msPer = options[_msPerOpStr];
        let opDec = _msAccum / msPer;
        _opfAllowance = Math.floor(opDec);
        _msAccum -= _opfAllowance * msPer;
    }
    return true;
}
async function _waitNoText() {
    while (_opfAllowance <= 0) {
        _lastFrameTime = performance.now();
        await new Promise(resolve => { setTimeout(resolve, 0) }); // wait one frame
        if (_cancel) {
            return false;
        }
        // calculate new ops per frame
        _msAccum += performance.now() - _lastFrameTime;
        let msPer = options[_msPerOpStr];
        let opDec = _msAccum / msPer;
        _opfAllowance = Math.floor(opDec);
        _msAccum -= _opfAllowance * msPer;
    }
    return true;
}

function _setTimeTakenText() {
    _timeTakenText.innerHTML = ((performance.now() - _startTime) / 1000.0).toFixed(2) + " s";
}

async function genRandomLines(rng) {
    for (let y = 0; y < GRIDY; y++) {
        for (let x = 0; x < GRIDX; x++) {
            if (rng() < 0.02) {
                let dir = rng();
                for (let i = 0; i < rng() * 20 + 2; ++i) {
                    if (dir < .25) { // left
                        safeset(x - i, y, WALL);
                    } else if (dir < .5) {
                        safeset(x + i, y, WALL);
                    } else if (dir < .75) {
                        safeset(x, y - i, WALL);
                    } else {
                        safeset(x, y + i, WALL);
                    }
                    ++_ops;
                    if (!options.genInstant && --_opfAllowance <= 0 && !await _wait()) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

function isInBounds(n) {
    return n.x >= 0 && n.y >= 0 && n.x < GRIDX && n.y < GRIDY;
}

async function depthFirstMaze(rng) {
    let orderings = [
        [1, 2, 3, 4], [2, 1, 3, 4], [3, 1, 2, 4], [1, 3, 2, 4], [2, 3, 1, 4], [3, 2, 1, 4], [3, 2, 4, 1], [2, 3, 4, 1],
        [4, 3, 2, 1], [3, 4, 2, 1], [2, 4, 3, 1], [4, 2, 3, 1], [4, 1, 3, 2], [1, 4, 3, 2], [3, 4, 1, 2], [4, 3, 1, 2],
        [1, 3, 4, 2], [3, 1, 4, 2], [2, 1, 4, 3], [1, 2, 4, 3], [4, 2, 1, 3], [2, 4, 1, 3], [1, 4, 2, 3], [4, 1, 2, 3]
    ]
    let dirs = [-1, 0, 0, -1, 1, 0, 0, 1]; // x,y

    let stack = [];
    let visited = new Set();

    let startX = Math.floor(rng() * GRIDX);
    let startY = Math.floor(rng() * GRIDY);

    let setGridSquareD = function (x, y, g) {
        grid[y][x] = g;
        drawOnGridMAZE(x, y, g);
    }

    let startNode = new PathNode(startX, startY, null)
    stack.push(startNode);
    setGridSquareD(startNode.x, startNode.y, FLOOR);
    visited.add(startNode.hash());

    // set grid as all walls
    for (let y = 0; y < GRIDY; y++) {
        for (let x = 0; x < GRIDX; x++) {
            grid[y][x] = WALL;
        }
    }

    while (stack.length > 0) {
        let n = stack[stack.length - 1];

        let order = orderings[Math.floor(rng() * 24)];
        let deadEnd = true;
        for (let i = 0; i < order.length; ++i) {
            let o = order[i] - 1;
            let dirx = dirs[o * 2];
            let diry = dirs[o * 2 + 1];

            let nn = new PathNode(n.x + dirx * 2, n.y + diry * 2, n);
            if (isInBounds(nn) && !visited.has(nn.hash())) {
                visited.add(nn.hash());
                // remove wall between you two
                setGridSquareD(n.x + dirx, n.y + diry, FLOOR);
                ++_ops;
                if (!options.genInstant && --_opfAllowance <= 0 && !await _wait()) {
                    return false;
                }
                // and remove wall on new guy
                setGridSquareD(nn.x, nn.y, FLOOR);
                ++_ops;
                if (!options.genInstant && --_opfAllowance <= 0 && !await _wait()) {
                    return false;
                }
                stack.push(nn);
                deadEnd = false;
                break;
            }
        }
        if (deadEnd) {
            stack.pop();
            drawOnGridMAZE(n.x, n.y, BACKTRACK);
            ++_ops;
            if (!options.genInstant && --_opfAllowance <= 0 && !await _wait()) {
                return false;
            }
            if (n.parent != null) {
                let dirx = n.parent.x - n.x;
                let diry = n.parent.y - n.y;
                drawOnGridMAZE(n.x + dirx / 2, n.y + diry / 2, BACKTRACK);
                ++_ops;
                if (!options.genInstant && --_opfAllowance <= 0 && !await _wait()) {
                    return false;
                }
            }
        }

    }

    return true;
}

async function genGrid() { // randomly draws lines on the grid
    if (_operating) {
        console.log("thats weird...");
        return;
    }
    _operating = true;
    _cancel = false;
    _ops = 0;
    _opfAllowance = 1;
    _msAccum = 0;
    _lastFrameTime = 0;
    _startTime = performance.now();
    _opsText = genOpsText;
    _timeTakenText = genTimeTakenText;
    _msPerOpStr = "genMsPerOp";

    clearGenUI();
    genInfoText.innerHTML = "Generating grid...";
    // calculate seed
    let seed;
    if (randomSeedCheckbox.checked || seedInputBox.value == "") {
        seed = getStrSeed(10);
        seedInputBox.value = seed;
    } else {
        seed = seedInputBox.value;
    }
    seed += GRIDX * GRIDY; // so seeds look different between grid sizes as well
    let rng = new Math.seedrandom(seed);
    let finished = false;
    let genAlgo = genAlgoSelect.value;
    if (genAlgo == "RandomLines") {
        finished = await genRandomLines(rng);
    } else if (genAlgo == "DepthFirstMaze") {
        finished = await depthFirstMaze(rng);
    } else {
        console.log("wtf");
    }
    if (finished) {
        _setTimeTakenText();
        genInfoText.innerHTML = "Done!";
        genOpsText.innerHTML = _ops;
    } else {
        clearGenUI();
    }
    _operating = false;
}

function drawBackground() {
    background(backgroundColor);
    stroke(0);
    strokeWeight(1);
    let w = GRIDX * GRID_SIZE + 1;
    let h = GRIDY * GRID_SIZE + 1;
    line(0, 0, w, 0);
    line(0, 0, 0, h);
    line(0, h, w, h);
    line(w, 0, w, h);
}

async function redrawGrid() {
    let starter = performance.now();
    drawBackground();
    strokeWeight(1);
    // this is more optimized than using the functions, bout twice as fast this way
    // biggest maze 270ms
    if (!drawOutlinesCheckbox.checked) {
        stroke(wallColor);
        fill(wallColor);
        for (let y = 0; y < GRIDY; ++y) {
            for (let x = 0; x < GRIDX; ++x) {
                //drawGridSquare(x, y);
                if (grid[y][x] == WALL) {
                    square(x * GRID_SIZE + origX, y * GRID_SIZE + origY, GRID_SIZE - 1);
                }
            }
        }
    } else {
        stroke(0);
        fill(wallColor);
        for (let y = 0; y < GRIDY; ++y) {
            for (let x = 0; x < GRIDX; ++x) {
                //drawGridSquare(x, y);
                if (grid[y][x] == WALL) {
                    square(x * GRID_SIZE + origX, y * GRID_SIZE + origY, GRID_SIZE);
                }
            }
        }
    }

    // draw random y rows until refreshed
    // randoList = [];
    // for (let y = 0; y < GRIDY; ++y) {
    //     randoList.push(y);
    // }
    // shiffle(randoList);
    // for (let i = 0; i < GRIDY; ++i) {
    //     let y = randoList[i];
    //     for (let x = 0; x < GRIDX; ++x) {
    //         drawGridSquare(x, y);
    //     }
    //     if (i % 100 == 0) {
    //         await wait(0);
    //     }
    // }

    // draw it out with some noise? kinda scuffed
    // let drawPerFrame = 13789;
    // let squares = Math.floor(GRIDX * GRIDY / drawPerFrame); // how many times u need to draw to complete
    // if (squares < 1) {
    //     squares = 1;
    // }
    // // each time draw a random square!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // let randoList = [];
    // for (let i = 0; i < squares; ++i) {
    //     randoList.push(i);
    // }
    // shiffle(randoList);

    // for (let s = 0; s < squares; ++s) {
    //     for (let i = randoList[s]; true; i += squares) {
    //         if (i >= GRIDX * GRIDY) {
    //             i -= GRIDX * GRIDY;
    //             let x = Math.floor(i % GRIDX);
    //             let y = Math.floor(i / GRIDX);
    //             drawGridSquare(x, y);
    //             break;
    //         }
    //         let x = Math.floor(i % GRIDX);
    //         let y = Math.floor(i / GRIDX);
    //         drawGridSquare(x, y);
    //     }
    //     await wait(0);
    // }

    //console.log(performance.now() - starter);
    gridDirty = false;
}

function setGridSquare(x, y, g) {
    grid[y][x] = g;
    drawOnGrid(x, y, g);
}

function drawGridSquare(x, y) {
    let g = grid[y][x];
    if (g != FLOOR) {
        drawOnGrid(x, y, g);
    }
}

function getPixelPosOdd(x, y) {
    return { x: x * GRID_SIZE + pixOffXOdd, y: y * GRID_SIZE + pixOffYOdd };
}
function getPixelPosEven(x, y) {
    return { x: x * GRID_SIZE + pixOffXEven, y: y * GRID_SIZE + pixOffYEven };
}

let drawOnGrid = drawOnGridOutline;

function drawOnGridOutline(x, y, g) {
    strokeWeight(1);
    stroke(0);
    switch (g) {
        case WALL: fill(wallColor); break;
        case FLOOR: stroke(255); fill(255); break;
        case SELECT: fill(255, 0, 0); break;
        case SELECT2: fill(0, 0, 255); break;
        case VISITED: stroke(150, 255, 150); fill(150, 255, 150); break;
        case BACKTRACK: stroke(0, 0, 255); fill(0, 0, 255); break;
        default: fill(255, 0, 255); break; // unknown?
    }
    square(x * GRID_SIZE + origX, y * GRID_SIZE + origY, GRID_SIZE);
}
function drawOnGridRegular(x, y, g) {
    strokeWeight(1);
    switch (g) {
        case WALL: stroke(wallColor); fill(wallColor); break;
        case FLOOR: stroke(255); fill(255); break;
        case SELECT: stroke(255, 0, 0); fill(255, 0, 0); break;
        case SELECT2: stroke(0, 0, 255); fill(0, 0, 255); break;
        case VISITED: stroke(150, 255, 150); fill(150, 255, 150); break;
        case BACKTRACK: stroke(0, 0, 255); fill(0, 0, 255); break;
        default: fill(255, 0, 255); break; // unknown?
    }
    square(x * GRID_SIZE + origX, y * GRID_SIZE + origY, GRID_SIZE - 1);
}

function drawOnGridMAZE(x, y, g) {
    strokeWeight(1);
    switch (g) {
        case WALL: stroke(0); fill(wallColor); break;
        case BACKTRACK: stroke(0, 0, 255); fill(0, 0, 255); break;
        case FLOOR: stroke(255); fill(255); break;
        case VISITED: stroke(150, 255, 150); fill(150, 255, 150); break;
        case SELECT: stroke(255, 0, 0); fill(255, 0, 0); break;
        default: fill(255, 0, 255); break; // unknown?
    }
    square(x * GRID_SIZE + origX, y * GRID_SIZE + origY, GRID_SIZE - 1);
}

function eraseOnGrid(x, y) {
    grid[y][x] = FLOOR;
    strokeWeight(1);
    stroke(backgroundColor);
    fill(backgroundColor);
    square(x * GRID_SIZE + origX, y * GRID_SIZE + origY, GRID_SIZE);
    saferedraw(x - 1, y);
    saferedraw(x + 1, y);
    saferedraw(x, y - 1);
    saferedraw(x, y + 1);
}

function drawLineToParent(n, r, g, b, width) {
    let pp, parpp;
    if (width % 2 == 0) {
        pp = getPixelPosEven(n.x, n.y);
        parpp = getPixelPosEven(n.parent.x, n.parent.y);
    } else {
        pp = getPixelPosOdd(n.x, n.y);
        parpp = getPixelPosOdd(n.parent.x, n.parent.y);
    }
    stroke(r, g, b);
    strokeWeight(width);
    line(pp.x, pp.y, parpp.x, parpp.y);
}

function lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t
}

function draw() {

    if (mouseIsPressed && !_operating && lastMouseStartX >= 155) {
        let x = (mouseX - origX) / GRID_SIZE;
        x = Math.floor(x);
        let y = (mouseY - origY) / GRID_SIZE;
        y = Math.floor(y);

        // give a little leeway if slightly off the side of grid
        if (x >= -1 && x < 0) {
            x = 0;
        }
        if (y >= -1 && y < 0) {
            y = 0;
        }
        if (x >= GRIDX && x < GRIDX + 1) {
            x = GRIDX - 1;
        }
        if (y >= GRIDY && y < GRIDY + 1) {
            y = GRIDY - 1;
        }

        if (x >= 0 && x < GRIDX && y >= 0 && y < GRIDY) {
            if (lastMouseButton == LEFTMOUSE) {
                if (gridDirty) {
                    redrawGrid();
                }
                if (wasHoldingShiftWhenMousePressed) {
                    eraseOnGrid(x, y);
                } else {
                    setGridSquare(x, y, WALL);
                }
            } else if (lastMouseButton == RIGHTMOUSE && mouseJustPressed && grid[y][x] == FLOOR) {
                //console.log(x + ' ' + y);
                if (pathStartX == -1 && pathStartY == -1) { // first time you right click
                    clearPathUI();

                    drawOnGrid(x, y, SELECT); // doing this just to place it in grid actually so when redrawn its there
                    redrawGrid();
                    //setGridSquare(x, y, SELECT);
                    drawOnGrid(x, y, SELECT);   // draw again after redraw just incase i dunno
                    pathStartX = x;
                    pathStartY = y;
                } else if (pathEndX == -1 && pathEndY == -1) {
                    if (pathStartX == x && pathStartY == y) { // turn off then
                        eraseOnGrid(x, y);
                        pathStartX = pathStartY = -1;
                    } else {
                        drawOnGrid(x, y, SELECT);
                        pathEndX = x;
                        pathEndY = y;
                        findPath();
                    }
                }
            }
        }

    }

    mouseJustPressed = false;
}

async function backTracePath(n) {   // given current node n, backtrace and render out path
    _setTimeTakenText();
    pathInfoText.innerHTML = "Found path! backtracking..."
    pathOpsText.innerHTML = _ops;

    _opfAllowance = 1;
    _msPerOpStr = "backtrackMsPerOp";

    let pathLength = 0;
    let endNode = n; // save this so can reset
    while (n.parent != null) { // calc path length real quick then reset it to animate it
        ++pathLength;
        n = n.parent;
    }
    n = endNode;

    // always trace path in 2 seconds but also a little slower if the path is long
    options.backtrackMsPerOp = 1000.0 / Math.pow(pathLength, .85);
    let counter = 0;
    colorMode(HSB, 100);
    let first = true;
    let widener = GRID_SIZE > 2 ? 2 : 1;
    while (n.parent != null && !_cancel) {
        let t = counter / pathLength;
        drawLineToParent(n, lerp(65, 100, t), 100, 100, LINE_WIDTH + widener);
        if (first) { // omg this is PUKE, todo convert everything to 100 hsb
            first = false;
            colorMode(RGB, 255);
            drawOnGrid(n.x, n.y, SELECT);
            colorMode(HSB, 100);
        }
        ++counter;
        n = n.parent;
        if (!options.pathInstant && --_opfAllowance <= 0) {
            pathLengthText.innerHTML = counter;
            if (!await _waitNoText()) {
                return;
            }
        }

    }
    pathLengthText.innerHTML = counter;
    colorMode(RGB, 255);
}

async function astar(startNode) {
    let openList = TinyQueue();
    
}

async function dijkstras(startNode) {
    let frontier = new Queue();
    frontier.enqueue(startNode);
    let visited = new Set();
    visited.add(startNode.hash());
    while (!frontier.isEmpty()) {
        let n = frontier.dequeue();
        ++_ops;
        // let h = n.hash();
        // if (visited.has(h)) { //|| n.x < 0 || n.y < 0 || n.x >= GRIDX || n.y >= GRIDY || grid[n.y][n.x] != FLOOR) {
        //     continue;
        // }
        // visited.add(h);

        //console.log(p.x + " " + p.y);

        if (n.parent != null) {
            // drawLineToParent(n, 0, 200, 0, LINE_WIDTH);
            drawLineToParentPath(n);
            if (n.parent.x == pathStartX && n.parent.y == pathStartY) { // keep starting point above the green lines
                drawOnGrid(n.parent.x, n.parent.y, SELECT);
                stroke(pathColor); // for path coloring
                strokeWeight(LINE_WIDTH);
            }
        }
        if (n.x == pathEndX && n.y == pathEndY) {
            await backTracePath(n);
            break;
        }

        // get bools for if sides are floors
        let sl = n.x > 0 && grid[n.y][n.x - 1] == FLOOR;
        let su = n.y > 0 && grid[n.y - 1][n.x] == FLOOR;
        let sr = n.x < GRIDX - 1 && grid[n.y][n.x + 1] == FLOOR;
        let sd = n.y < GRIDY - 1 && grid[n.y + 1][n.x] == FLOOR;

        let lh = bhash(n.x - 1, n.y);
        if (sl && !visited.has(lh)) {   // left
            visited.add(lh);
            frontier.enqueue(new PathNode(n.x - 1, n.y, n));
        }
        let uh = bhash(n.x, n.y - 1);
        if (su && !visited.has(uh)) {   // up
            visited.add(uh);
            frontier.enqueue(new PathNode(n.x, n.y - 1, n));
        }
        let rh = bhash(n.x + 1, n.y);
        if (sr && !visited.has(rh)) {   // right
            visited.add(rh);
            frontier.enqueue(new PathNode(n.x + 1, n.y, n));
        }
        let dh = bhash(n.x, n.y + 1);
        if (sd && !visited.has(dh)) {   // down
            visited.add(dh);
            frontier.enqueue(new PathNode(n.x, n.y + 1, n));
        }
        if (sl && su && grid[n.y - 1][n.x - 1] == FLOOR && !visited.has(bhash(n.x - 1, n.y - 1))) { // up left
            visited.add(bhash(n.x - 1, n.y - 1));
            frontier.enqueue(new PathNode(n.x - 1, n.y - 1, n));
        }
        if (su && sr && grid[n.y - 1][n.x + 1] == FLOOR && !visited.has(bhash(n.x + 1, n.y - 1))) { // up right
            visited.add(bhash(n.x + 1, n.y - 1));
            frontier.enqueue(new PathNode(n.x + 1, n.y - 1, n));
        }
        if (sr && sd && grid[n.y + 1][n.x + 1] == FLOOR && !visited.has(bhash(n.x + 1, n.y + 1))) { // down right
            visited.add(bhash(n.x + 1, n.y + 1));
            frontier.enqueue(new PathNode(n.x + 1, n.y + 1, n));
        }
        if (sd && sl && grid[n.y + 1][n.x - 1] == FLOOR && !visited.has(bhash(n.x - 1, n.y + 1))) { // down left
            visited.add(bhash(n.x - 1, n.y + 1));
            frontier.enqueue(new PathNode(n.x - 1, n.y + 1, n));
        }

        if (!options.pathInstant && --_opfAllowance <= 0 && !await _wait()) {
            break;
        }

    }
}

// finds path between 
async function findPath() {
    if (_operating) {
        console.log("thats weird...");
        return;
    }
    _operating = true;
    _cancel = false;
    _ops = 0;
    _opfAllowance = 1;
    _msAccum = 0;
    _lastFrameTime = 0;
    _startTime = performance.now();
    _opsText = pathOpsText;
    _timeTakenText = pathTimeTakenText;
    _msPerOpStr = "pathMsPerOp";

    stroke(pathColor); // 200
    strokeWeight(LINE_WIDTH);

    clearPathUI();
    pathInfoText.innerHTML = "Finding path...";

    gridDirty = true;

    let startNode = new PathNode(pathStartX, pathStartY, null);

    let pathAlgo = pathAlgoSelect.value;
    if (pathAlgo == "Dijkstra's") {
        await dijkstras(startNode);
    } else if (pathAlgo == "A* search") {
        await astar(startNode);
    } else {
        console.log("wtf");
    }

    if (_cancel) {
        clearPathUI();
    } else {
        pathOpsText.innerHTML = _ops;
        if (pathInfoText.innerHTML.includes("Found")) {
            pathInfoText.innerHTML = "Path Complete";
        } else {
            pathInfoText.innerHTML = "No path possible";
            _setTimeTakenText();
        }
    }
    pathStartX = pathStartY = pathEndX = pathEndY = -1;
    _operating = false;
}

let lastMouseButton = -1;
let mouseJustPressed = false;
let wasHoldingShiftWhenMousePressed = false;
let lastMouseStartX = 0;
function mousePressed(event) {
    lastMouseStartX = event.x; // for sidebar tracking
    lastMouseButton = event.button;
    mouseJustPressed = true;
    wasHoldingShiftWhenMousePressed = keyIsDown(SHIFT);
}

function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

document.oncontextmenu = function () {
    return false;
}


// let defaultCheckbox = document.getElementById("defaultCheckbox");
// defaultCheckbox.onchange = function () {
//     if (this.checked) {
//         mainOptionsInternalDiv.classList.add("mydis");
//         recalcDefaults();
//     } else {
//         mainOptionsInternalDiv.classList.remove("mydis");
//     }
// }

class SliderBox {
    constructor(name, varLookup) {
        if (varLookup == undefined) {
            this.varLookup = name;
        } else {
            this.varLookup = varLookup;
        }
        this.slider = document.getElementById(name + "Slider");
        this.text = document.getElementById(name + "Text")
        //this.text.innerHTML = this.slider.value;
        this.slider.oninput = () => {
            this.text.innerHTML = this.slider.value;
            options[this.varLookup] = Math.floor(this.slider.value);
            //console.log(options[this.varLookup]);
        }
    }

    update = () => {
        let v = Math.floor(options[this.varLookup]);
        this.slider.value = v;
        this.text.innerHTML = v;
    }
}

class OpsSlider {
    constructor(name, lookup) {
        this.lookup = lookup;
        this.slider = document.getElementById(name + "Slider");
        this.text = document.getElementById(name + "Text")

        this.slider.oninput = () => {
            let val = this.slider.value;
            if (val <= 50) {
                val = lerp(1, 100, val / 50.0);
            } else {
                //val = 5.1557e-10 * Math.pow(val, 6.643856);
                val = 1.170663e-15 * Math.pow(val, 9.965784); // 100-100000
                //val = 2.926659e-12 * Math.pow(val, 7.965784); // 100-25000
            }
            val = Math.round(val);
            this.text.innerHTML = val;
            options[this.lookup] = 1000.0 / val;
        }
    }
}

class CheckboxOptionDivToggle {
    constructor(checkboxName, divName, optionName) {
        let cb = document.getElementById(checkboxName);
        let div = document.getElementById(divName);
        cb.onchange = function () {
            options[optionName] = this.checked;
            if (this.checked) {
                div.classList.add("mydis");
            } else {
                div.classList.remove("mydis");
            }
        }
    }
}


let gridDimsText = document.getElementById("gridDimsText");

//let mainOptionsInternalDiv = document.getElementById("mainOptionsInternal");

let gridSizeSlider = new SliderBox("gridSize", "GRID_SIZE");
// Update the current slider value (each time you drag the slider handle)
gridSizeSlider.slider.onchange = function () {
    GRID_SIZE = parseInt(this.value); // can go down to 2 visibly

    initGrid();
    setTimeout(genGrid, 5);
}

let clearGridButton = document.getElementById("clearGridButton");
clearGridButton.onclick = function () {
    initGrid();
}
let drawOutlinesCheckbox = document.getElementById("drawOutlinesCheckbox");
drawOutlinesCheckbox.onchange = function () {
    drawOnGrid = this.checked ? drawOnGridOutline : drawOnGridRegular;
    if (!_operating) {
        redrawGrid();
    }
}

let genAlgoSelect = document.getElementById("genAlgoSelect");
let seedInputBox = document.getElementById("seedInputBox");
seedInputBox.maxLength = 64;
let randomSeedCheckbox = document.getElementById("randomSeedCheckbox");
let genInstantCheckbox = new CheckboxOptionDivToggle("genInstantCheckbox", "genOptions", "genInstant");
let genOpsSlider = new OpsSlider("genOpsPerSecond", "genMsPerOp");
let genOpsText = document.getElementById("genOpsText");
let genTimeTakenText = document.getElementById("genTimeTakenText");
let genInfoText = document.getElementById("genInfoText");

let pathAlgoSelect = document.getElementById("pathAlgoSelect");
let pathInstantCheckbox = new CheckboxOptionDivToggle("pathInstantCheckbox", "pathOptions", "pathInstant");
let pathOpsSlider = new OpsSlider("pathOpsPerSecond", "pathMsPerOp");
let pathOpsText = document.getElementById("pathOpsText");
let pathTimeTakenText = document.getElementById("pathTimeTakenText");
let pathLengthText = document.getElementById("pathLengthText");
let pathInfoText = document.getElementById("pathInfoText");

function clearPathUI() {
    pathInfoText.innerHTML = "";
    pathTimeTakenText.innerHTML = '0.00 s';
    pathOpsText.innerHTML = '0';
    pathLengthText.innerHTML = '0';
}

function clearGenUI() {
    genInfoText.innerHTML = "";
    genTimeTakenText.innerHTML = '0.00 s';
    genOpsText.innerHTML = '0';
}


let regenGridButton = document.getElementById("regenGridButton");
regenGridButton.onclick = function () {
    initGrid();
    setTimeout(genGrid, 5);
}
