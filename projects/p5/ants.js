
// turn this into ant simulator where grass grows slowly
// and any ants walking over it will eat the grass and grow a bit

var ants = [];
var tree;

function setup() {
	createCanvas(windowWidth, windowHeight);
	//colorMode(HSB, 100);
	stroke(0);
	strokeWeight(2);
	frameRate(30);
	//noStroke();  // Don't draw a stroke around shapes

	for (let i = 0; i < 5000; ++i) {
		ants.push(new Ant(random(windowWidth), random(windowHeight)));
	}
}

function draw() {
	background(30, 30, 30);

	stroke(0);
	strokeWeight(2);
	fill(0);
	for (let i = 0; i < ants.length; ++i) {
		if (ants[i].dead) {
			ants[i] = ants[ants.length - 1];
			ants.pop();
			--i;
			continue;
		}

		ants[i].update();
		ants[i].render();
	}

	tree = new Quadtree(0, 0, windowWidth, windowHeight, 0);
	for (let i = 0; i < ants.length; ++i) {
		let a = ants[i];
		tree.insert(new QuadtreeItem(a.pos.x, a.pos.y, a.size, a.size, a));
	}

	stroke(0, 255, 0);
	strokeWeight(1);
	noFill();
	tree.render();

	tree.checkCollision();

}

function Ant(x, y) {
	this.pos = createVector(x, y);
	this.vel = createVector(0, random(5) + 5)
	this.nextDecide = 0;
	this.dir = 0;
	this.size = 10;
	this.dead = false;
	this.speed = 1;
}

Ant.prototype.update = function () {
	//this.pos.add(this.vel);
	var move = random(1) + this.speed;

	this.nextDecide -= 1;
	if (this.nextDecide < 0) {
		this.nextDecide = random(20) + 5;

		var newDir = floor(random(4));
		if (this.dir != newDir) {
			this.dir = newDir;
			//stroke(0,100,20);
			//this.size = 13;
		}
	} else {
		//this.size = 10;
	}

	if (this.dir == 0) { // left 
		this.pos.x -= move;
	} else if (this.dir == 1) {
		this.pos.x += move;
	} else if (this.dir == 2) {
		this.pos.y += move;
	} else if (this.dir == 3) {
		this.pos.y -= move;
	}

	if (this.pos.x + this.size > windowWidth) {
		this.pos.x = windowWidth - this.size;
		this.nextDecide = -1;
	}
	if (this.pos.x < 0) {
		this.pos.x = 0;
		this.nextDecide = -1;
	}
	if (this.pos.y + this.size > windowHeight) {
		this.pos.y = windowHeight - this.size;
		this.nextDecide = -1;
	}
	if (this.pos.y < 0) {
		this.pos.y = 0;
		this.nextDecide = -1;
	}
}

Ant.prototype.render = function () {
	//ellipse(this.pos.x, this.pos.y, 5);
	//rect(this.pos.x - this.size / 2, this.pos.y - this.size / 2, this.size, this.size);
	rect(this.pos.x, this.pos.y, this.size, this.size);
}

Ant.prototype.eat = function (g) {
	// kind of trash, sometimes you get really big guys fast if they each a bunch of small
	// dudes because more mass is lost the greater the size with this formula
	this.size += Math.sqrt(g.size);
	this.speed += 0.2;
	g.dead = true;
}


function QuadtreeItem(x, y, w, h, r) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	//this.t = t; // type int
	this.r = r; // reference to class?
}

var MAX_ITEMS = 10;
var MAX_LEVEL = 10;
function Quadtree(x, y, w, h, level) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.level = level;

	this.children = [];

	this.items = [];
}

Quadtree.prototype.insert = function (qti) {
	if (this.children.length == 0) {
		this.items.push(qti);

		if (this.items.length > MAX_ITEMS && this.level < MAX_LEVEL) {
			this.split();

			while (this.items.length > 0) {
				this.insert(this.items.pop());
			}
		}
	} else {
		let mx = this.x + this.w / 2.0;
		let my = this.y + this.h / 2.0;

		if (qti.y < my) {
			if (qti.x < mx) {
				this.children[0].insert(qti);
			}
			if (qti.x + qti.w >= mx) {
				this.children[1].insert(qti);
			}
		}
		if (qti.y + qti.h >= my) {
			if (qti.x < mx) {
				this.children[2].insert(qti);
			}
			if (qti.x + qti.w >= mx) {
				this.children[3].insert(qti);
			}
		}
	}
}

Quadtree.prototype.split = function () {
	let w2 = this.w / 2.0;
	let h2 = this.h / 2.0;

	// upper left is 0,0 in p5
	// tl tr bl br
	this.children.push(new Quadtree(this.x, this.y, w2, h2, this.level + 1))
	this.children.push(new Quadtree(this.x + w2, this.y, w2, h2, this.level + 1))
	this.children.push(new Quadtree(this.x, this.y + h2, w2, h2, this.level + 1))
	this.children.push(new Quadtree(this.x + w2, this.y + h2, w2, h2, this.level + 1))
}

Quadtree.prototype.render = function () {
	if (this.children.length == 0) {
		rect(this.x, this.y, this.w, this.h);
	} else {
		for (let i = 0; i < 4; ++i) {
			this.children[i].render();
		}
	}
}

Quadtree.prototype.checkCollision = function () {
	if (this.children.length == 0) {

		for (let i = 0; i < this.items.length; ++i) {
			for (let j = i + 1; j < this.items.length; ++j) {
				let a = this.items[i];
				let b = this.items[j];

				if (a.r.dead || b.r.dead || a.r == b.r) {
					continue;
				}

				let col = a.x <= b.x + b.w && a.y <= b.y + b.h && a.x + a.w >= b.x && a.y + a.h >= b.y;

				if (col) {
					if (a.r.size > b.r.size) {
						a.r.eat(b.r);
					} else if (b.r.size > a.r.size) {
						b.r.eat(a.r);
					} else {
						if (random() < 0.5) {
							a.r.eat(b.r);
						} else {
							b.r.eat(a.r);
						}
					}
				}
			}
		}

	} else {
		for (let i = 0; i < 4; ++i) {
			this.children[i].checkCollision();
		}
	}
}