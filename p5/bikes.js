var bikes = []

function setup(){
	createCanvas(windowWidth, windowHeight);
	colorMode(HSB, 100);
	stroke(0);
	strokeWeight(2);
	noFill();
	//frameRate(10);
	//noStroke();  // Don't draw a stroke around shapes
	for(var i = 0; i < 5; ++i){
		bikes.push(new Bike(random(windowWidth), random(windowHeight)));
	}
}


function draw(){
	background(30)

	for(var i = 0; i < bikes.length; ++i){
		bikes[i].update();
		bikes[i].render();
	}

}

function mousePressed() {
	bikes.push(new Bike(mouseX, mouseY));
}

function Bike(x,y){
	this.pos = createVector(x,y);
	//this.wwidth = random(20,40);
	this.wwidth = map(y, 0, windowHeight, 20, 60);
	//this.vel = createVector(random(1,4), 0);
	this.vel = createVector(this.wwidth/10 + random(-.5,.5), random(-.1,.1));
	this.spacing = this.wwidth * 1.5;
	this.color = color(random(100), 100, 100);
	//this.wcolor = color(0, 0, random(10));
	this.wcolor = color(0, 0, 10);
	this.rot1 = random(Math.PI);
	this.rot2 = random(Math.PI);
	this.spos = createVector(x + this.wwidth, y);
}

Bike.prototype.update = function(){
	this.pos.add(this.vel);
	var hw = this.wwidth / 2;
	if(this.pos.x > windowWidth + hw){
		this.pos.x = -(this.spacing + hw);
	}
	var r = 2 * this.vel.x / this.wwidth;
	this.rot1 += r;
	this.rot2 += r;
}

Bike.prototype.render = function(){
	var hw = this.wwidth / 2;

	//stroke(0);
	//strokeWeight(this.wwidth / 20);
	stroke(this.wcolor);

	// wheels 
	ellipse(this.pos.x, this.pos.y, this.wwidth);
	ellipse(this.pos.x + this.spacing, this.pos.y, this.wwidth);

	//strokeWeight(this.wwidth / 30);

	// left spokes
	push();
	translate(this.pos.x, this.pos.y);
	rotate(this.rot1, this.pos);
	line(-hw, 0, hw, 0);
	line(0, -hw, 0, hw);
	pop();
	// right spokes
	push();
	translate(this.pos.x + this.spacing, this.pos.y);
	rotate(this.rot2, this.pos);
	line(-hw, 0, hw, 0);
	line(0, -hw, 0, hw);
	pop();

	stroke(this.color);
	//strokeWeight(this.wwidth / 15);
	// line(this.pos.x, this.pos.y, this.pos.x + this.spacing, this.pos.y);
	// line(this.pos.x, this.pos.y, this.pos.x + hw*.8, this.pos.y - hw);
	// line(this.pos.x + hw*.8, this.pos.y - hw, this.pos.x + this.spacing - hw, this.pos.y - hw);
	// line(this.pos.x + this.spacing - hw, this.pos.y - hw, this.pos.x + this.spacing, this.pos.y);

	// handle
	arc(this.pos.x+this.spacing-hw, this.pos.y-(hw*1.5), hw, hw, 0, HALF_PI);

	// frame
	beginShape();
	vertex(this.pos.x, this.pos.y);
	vertex(this.pos.x + hw*.8, this.pos.y - hw);
	vertex(this.pos.x + this.spacing - hw, this.pos.y - hw);
	vertex(this.pos.x + this.spacing, this.pos.y);
	endShape();
}


//a stealthy think that draws bikes out of circles and lines
//then whenever mouse is moved it moves bikes a little
//ppl wont notice but only if u spam mouse then all bikes start driving
//across screen!!!