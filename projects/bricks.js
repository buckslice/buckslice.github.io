
let bricks = [];
let xbricks, ybricks, xslots, brickW, brickH, grav;

var canvas;

let brickCount = 0;
let nextBreakCounter = 0;
let brokeOwn = true;

if(typeof lost == 'undefined'){
	lost = false;
}
if(typeof lab == 'undefined'){
	lab = false;
}

function setup(){
	canvas = createCanvas(windowWidth, windowHeight);
	canvas.position(0,0);
	canvas.style('z-index', '-5');
	
	grav = createVector(0, 0.3);
	xbricks = min(35, floor(windowWidth / 100));
	ybricks = min(21, floor(windowHeight / 60));
	xslots = xbricks * 2 + 1; // spots in each row for a brick
	colorMode(RGB, 1);
	strokeWeight(2);
	frameRate(60);
	brickW = windowWidth / xbricks;
	brickH = windowHeight / ybricks;
	
	dposx = random(0, windowWidth-durw-20);
	dposy = random(windowHeight / 2, windowHeight-durh);
	
	if(lost){
		brokeOwn = false;
	}
	
	// make it so clicking on links doesnt break bricks
	links = selectAll('.link');
	for(let i = 0; i < links.length; ++i){
		links[i].mouseOver(mouseOverLink);
		links[i].mouseOut(mouseOutLink);
	}
	
	for (let y = 0; y < ybricks; ++y){
		let row = [];
		let oddY = y % 2 == 1;
		for (let x = 0; x < xslots; ++x){
			let xp = ((x+1)/xslots);
			let yp = ((y+1)/ybricks);
			// random tuning to make colors look cool
			let g = max((xp + yp)*0.5 - 0.5, 0.0);
			let r = yp * 0.5-g;
			let b = xp * 0.4+0.1-g*0.6;
			g = g * 0;
			if(!lab){
				r = b;
				g = b;
			}
			
			if ((x+y) % 2 == 1){
				row.push(new Brick((x-1)*brickW/2, y * brickH, createVector(r,g,b)));
				brickCount += 1;
			}else{
				row.push(null);
			}
		}
		
		bricks.push(row);
	}
	
}

let overLink = false;
function mouseOverLink(){
	overLink = true;
}
function mouseOutLink(){
	overLink = false;
}

function windowResized(){
	resizeCanvas(windowWidth, windowHeight);
}

// make sure u clicking on the dur correctly
let good = false;
let opening = false;
let openTime = 0;
let dposx = 0;
let dposy = 0;
let durw = 50;
let durh = 80;
let canBreak = false;
function mousePressed(){
	good = checkDur();
	canBreak = !overLink;
}
function mouseReleased(){
	if(good && checkDur()){
		if(!opening){
			openTime = millis();
		}
		opening = true;
		setTimeout(function(){window.location.href = "laboratory.html";}, 500);
	}
}
// check if color at point is not monochromatic (dur)
function checkCol(x,y){
	c = get(x,y);
	return c[0] != c[1] || c[0] != c[2];
}
function checkDur(){
	return !lost && !lab && 
	checkCol(mouseX,mouseY) &&
	checkCol(dposx, dposy) &&
	checkCol(dposx+durw, dposy) &&
	checkCol(dposx, dposy+durh) &&
	checkCol(dposx+durw, dposy+durh) &&
	checkCol(dposx,dposy+durh/2.0) &&
	checkCol(dposx+durw,dposy+durh/2.0);
}

function draw(){
	background(0,0,0);
	
	// nothing to see here...
	if(!lab && !lost){
		if(opening){
			fill(0,0,0);
			rect(dposx, dposy, durw, durh);
			for(let i = 0; i < 5; ++i){
				let r = i*i * 0.04 + 0.1;
				let b = 0.3 - i * .05;
				stroke(r*0.5, 0, b*0.5);
				fill(r, 0, b);
				rect(dposx + i * 5, dposy + i * (12 - i * 1), durw - i * 8, durh - i * 2 -  i * (12 - i * 1));
			}
		}
		stroke(.15,.1,.05);
		fill(.22,.17,.07);
		let rf = opening ? max(.1, 1.0 - (millis() - openTime)/500) : 1.0;
		for(let i = 0; i < 4; ++i){
			rect(dposx + (i * durw / 4 * rf), dposy, durw / 4 * rf, durh);		
		}
		fill(.15,.1,.05);
		rect(dposx + (durw-10)*rf, dposy + durh/2, 10, 5);
	}
	
	if (canBreak && mouseIsPressed && mouseButton == LEFT){	
		if(breakBrick(mouseX, mouseY)){
			brokeOwn = true;
		}
	}
	// start breaking bricks slowly if no action
	if(!brokeOwn && millis() > 4000 && nextBreakCounter < millis()){
		breakBrick(random(windowWidth), random(windowHeight));
		nextBreakCounter = millis() + random(2000,4000);
	}
	
	for (let y = 0; y < bricks.length; ++y){
		for(let x = 0; x < bricks[y].length; ++x){
			if (bricks[y][x] != null){
				bricks[y][x].update();
				bricks[y][x].render();
			}
		}
	}
	
	mouseOverLink = false;
}

// break brick at xpos and ypos on screen
function breakBrick(xpos, ypos){
	for (let y = 0; y < bricks.length; ++y){
		for(let x = 0; x < bricks[y].length; ++x){
			if (bricks[y][x] != null && bricks[y][x].contains(xpos,ypos)){
				bricks[y][x] = null;
				brickCount -= 1;
				
				if(brickCount <= 0){
					setTimeout(function(){
						let d = select('.editable');
						if ( d != null){
							d.html('Nice job...');
						}
					}, 1000);
				}
				
				checkBricksAbove(x,y);
				
				return true;
			}
		}
	}
	return false;
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
		
		// check if theres a brick below this one
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
	this.curY = y;
	this.color = c;
}

Brick.prototype.contains = function(x,y){
	return x >= this.pos.x && x < this.pos.x+brickW && y >= this.pos.y && y < this.pos.y+brickH;
}	

Brick.prototype.update = function(){
	this.vel.add(grav);
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