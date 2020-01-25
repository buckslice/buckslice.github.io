var canvas;
let xbricks, ybricks, xslots, brickW, brickH, grav;
let bricks, brickCount, nextBreakCounter, brokeOwn;
let overLink, good, opening, openTime, dposx, dposy, durw, durh, canBreak;

function setup() { // called by p5.js
	canvas = createCanvas(windowWidth, windowHeight);
	reset();
}

function reset() {
	bricks = [];
	brickCount = 0;
	nextBreakCounter = 0;
	grav = createVector(0, 0.3);
	xbricks = min(35, floor(windowWidth / 100));
	ybricks = min(21, floor(windowHeight / 60));
	xslots = xbricks * 2 + 1; // spots in each row for a brick
	colorMode(RGB, 1);
	strokeWeight(2);
	frameRate(60);
	brickW = windowWidth / xbricks;
	brickH = windowHeight / ybricks;

	let r = random();
	let g = random();
	let b = random();

	for (let y = 0; y < ybricks; ++y) {
		let row = [];
		for (let x = 0; x < xslots; ++x) {
			if ((x + y) % 2 == 1) {
				row.push(new Brick((x - 1) * brickW / 2, y * brickH, createVector(r + random() * 0.1, g + random() * 0.1, b + random() * 0.1)));
				brickCount += 1;
			} else {
				row.push(null);
			}
		}

		bricks.push(row);
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}


function draw() {
	background(0, 0, 0);

	if (mouseIsPressed && mouseButton == LEFT) {
		if (breakBrick(mouseX, mouseY)) {
			brokeOwn = true;
		}
	}
	// start breaking bricks slowly if no action
	if (!brokeOwn && millis() > 4000 && nextBreakCounter < millis()) {
		breakBrick(random(windowWidth), random(windowHeight));
		nextBreakCounter = millis() + random(2000, 4000);
	}

	for (let y = 0; y < bricks.length; ++y) {
		for (let x = 0; x < bricks[y].length; ++x) {
			if (bricks[y][x] != null) {
				bricks[y][x].update();
				bricks[y][x].render();
			}
		}
	}

}

// break brick at xpos and ypos on screen
function breakBrick(xpos, ypos) {
	for (let y = 0; y < bricks.length; ++y) {
		for (let x = 0; x < bricks[y].length; ++x) {
			if (bricks[y][x] != null && bricks[y][x].contains(xpos, ypos)) {
				bricks[y][x] = null;
				brickCount -= 1;

				checkBricksAbove(x, y);

				return true;
			}
		}
	}
	return false;
}

function checkBricksAbove(x, y) {
	checkBrickFall(x - 1, y - 1);
	checkBrickFall(x, y - 1);
	checkBrickFall(x + 1, y - 1);
}

// check if brick at x,y should fall
function checkBrickFall(x, y) {
	if (x < 0 || y < 0 || x >= xslots || y >= ybricks || bricks[y][x] == null) {
		return;
	}

	let newY = y;
	let fell = false;
	while (true) {
		if (newY + 1 >= ybricks) { // hit bottom
			break;
		}

		// check if theres a brick below this one
		if (bricks[newY + 1][x] != null || // middle
			(x - 1 >= 0 && bricks[newY + 1][x - 1] != null) || // left 
			(x + 1 < xslots && bricks[newY + 1][x + 1] != null)) { // right

			break;
		} else {
			fell = true;
			newY += 1;
		}
	}

	if (fell) {
		bricks[y][x].curY = newY * brickH;
		bricks[newY][x] = bricks[y][x];
		bricks[y][x] = null;

		checkBricksAbove(x, y);
	}

}

function Brick(x, y, c) {
	this.pos = createVector(x, y);
	this.vel = createVector(0, 0);
	this.curY = y;
	this.color = c;
}

Brick.prototype.contains = function (x, y) {
	return x >= this.pos.x && x < this.pos.x + brickW && y >= this.pos.y && y < this.pos.y + brickH;
}

Brick.prototype.update = function () {
	this.vel.add(grav);
	this.pos.add(this.vel);

	if (this.pos.y >= this.curY) {
		this.vel.set(0, 0);
		this.pos.y = this.curY;
	}

}

Brick.prototype.render = function () {
	stroke(this.color.x, this.color.y, this.color.z);
	fill(this.color.x * 0.7, this.color.y * 0.7, this.color.z * 0.7);

	rect(this.pos.x, this.pos.y, brickW, brickH);
}