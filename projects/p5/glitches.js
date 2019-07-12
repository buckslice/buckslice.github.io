// turn this into ant simulator where grass grows slowly
// and any ants walking over it will eat the grass and grow a bit
// can have spatial partitioning. make it another page in your website

var glitches = [];

function setup(){
	createCanvas(windowWidth, windowHeight);
	colorMode(HSB, 100);
	stroke(0);
	strokeWeight(2);
	noFill();
	frameRate(30);
	//noStroke();  // Don't draw a stroke around shapes

	for(var i = 0; i < 1000; ++i){
		glitches.push(new Glitch(random(windowWidth), random(windowHeight)));
	}
}

function draw(){
	background(10);
	
	for(var i = 0; i < glitches.length; ++i){
		glitches[i].update();
		glitches[i].render();
	}
}


function Glitch(x,y){
	this.pos = createVector(x,y);
	this.vel = createVector(0, random(5)+5)
	this.nextDecide = 0;
	this.dir = 0;
	this.size = 5;
}

Glitch.prototype.update = function(){
	//this.pos.add(this.vel);
	
	var move = random(1) + 1;
	
	this.nextDecide -= 1;
	if (this.nextDecide < 0){
		this.nextDecide = random(20) + 5;
		
		var newDir = floor(random(3));
		if (this.dir != newDir){
			this.dir = newDir;
			//stroke(0,100,20);
			this.size = 13;
		}
	}else{
		this.size = 10;
		stroke(0);
	}

	if (this.dir == 0){ // left 
		this.pos.x -= move;
	}else if (this.dir == 1){
		this.pos.x += move;
	}else if (this.dir == 2){
		this.pos.y += move;
	}
	
	if(this.pos.x > windowWidth){
		this.pos.x = 0;
	}
	if(this.pos.x < 0){
		this.pos.x = windowWidth;
	}
	if(this.pos.y > windowHeight){
		this.pos.y = 0;
	}
	if(this.pos.y < 0){
		this.pos.y = windowHeight;
	}
}

Glitch.prototype.render = function(){
	//ellipse(this.pos.x, this.pos.y, this.size);
	rect(this.pos.x - this.size / 2, this.pos.y - this.size / 2, this.size, this.size);
}