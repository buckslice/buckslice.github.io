
let bricks = []; // laid out in 2D array
let xbricks, ybricks, xslots, brickW, brickH;

var canvas;

function setup(){
	canvas = createCanvas(windowWidth, windowHeight);
	canvas.position(0,0);
	canvas.style('z-index', '-5');
	
	xbricks = min(36, floor(windowWidth / 120)); // number of bricks in x direction
	ybricks = min(21, floor(windowHeight / 70));
	xslots = xbricks * 2 + 1
	//print(xbricks*ybricks);
	
	colorMode(RGB, 1);
	stroke(0);
	strokeWeight(2);
	noFill();
	frameRate(30);
	brickW = windowWidth / xbricks;
	brickH = windowHeight / ybricks;
	
	for (let y = 0; y < ybricks; ++y){
		let row = [];
		let oddY = y % 2 == 1;
		for (let x = 0; x < xslots; ++x){
			
			let r = ((y+1) / ybricks)*0.3 ;
			let g = 0.0;
			let b = ((x+1) / xslots) *0.5 ;
			
			if ((x+y) % 2 == 1){
				row.push(new Brick((x-1)*brickW/2, y * brickH, createVector(r,g,b)));
			}else{
				row.push(null);
			}
		}
		
		bricks.push(row);
	}
	
}

function windowResized(){
	resizeCanvas(windowWidth, windowHeight);
}

function draw(){
	background(0,0,0);
	
	if (mouseIsPressed && mouseButton == LEFT){	
		breakBrick();
	}
	
	for (let y = 0; y < bricks.length; ++y){
		for(let x = 0; x < bricks[y].length; ++x){
			if (bricks[y][x] != null){
				bricks[y][x].update();
				bricks[y][x].render();
			}
		}
	}
	
}

function breakBrick(){
	for (let y = 0; y < bricks.length; ++y){
		for(let x = 0; x < bricks[y].length; ++x){
			if (bricks[y][x] != null && bricks[y][x].contains(mouseX,mouseY)){
				bricks[y][x] = null;
				
				checkBricksAbove(x,y);
				
				return;
			}
		}
	}
}

function checkBricksAbove(x,y){
	checkBrickFall(x-1,y-1);
	checkBrickFall(x,y-1);
	checkBrickFall(x+1,y-1);
}

// check if brick at x,y should fall
function checkBrickFall(x, y) {
	if (x < 0 || y < 0 || x >= xslots || y >= ybricks || bricks[y][x] == null){
		return;
	}
	
	let newY = y;
	let fell = false;
	while(true){
		if (newY+1 >= ybricks){ // hit bottom
			break;
		}
		
		// check if brick below
		if( bricks[newY+1][x] != null || // middle
		    (x-1 >= 0 && bricks[newY+1][x-1] != null) || // left 
			(x+1 < xslots && bricks[newY+1][x+1] != null)){ // right
				
			break;
		}else{
			fell = true;
			newY += 1;
		}
	}
	
	if(fell){
		bricks[y][x].curY = newY*brickH;
		bricks[newY][x] = bricks[y][x];
		bricks[y][x] = null;
		
		checkBricksAbove(x,y);
	}
	
}

function Brick(x,y,c){
	this.pos = createVector(x,y);
	this.vel = createVector(0, 0);
	this.acc = createVector(0, 1);
	this.curY = y;
	this.color = c;
	this.size = 5;
}

Brick.prototype.contains = function(x,y){
	return x >= this.pos.x && x < this.pos.x+brickW && y >= this.pos.y && y < this.pos.y+brickH;
}	

Brick.prototype.update = function(){
	this.vel.add(this.acc);
	this.pos.add(this.vel);
	
	if (this.pos.y >= this.curY){
		this.vel.set(0,0);
		this.pos.y = this.curY;
	}
	
}

Brick.prototype.render = function(){
	stroke(this.color.x, this.color.y, this.color.z);
	fill(this.color.x * 0.7, this.color.y * 0.7, this.color.z * 0.7);
	
	rect(this.pos.x, this.pos.y, brickW, brickH);
}