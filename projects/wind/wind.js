// replicating these wind visuals
//http://hint.fm/wind/

let circCount = 40000;
let lineCount;
let camera, scene, renderer, circMesh, lineMesh;
var buffer, bufferScene, bufferMesh;
var ship, ship2;

var winds = [];

var grid = [];
var targetGrid = [];
var curGrid = [];
var GRIDX;
var GRIDY;
const SQR = 15;

let changeWindOverTime = false;
let windEllipseScale = .5;
let windMinEllipse = 0.1;
let fadeOpac = 0.05;
let changeTime = 600; // time in frames that wind changes
//let fadeOpac = 1;

// angle 0-180 increments of 15, starting at with wind direcion and ending at opposite wind direction
let speeds = [0.90, 0.93, 0.96, 1.01, 1.08, 1.12, 1.13, 1.08, 0.98, 0.85, 0.60, 0.20, 0.00];

let frame = 0; // frame counter for the wind changing stuff

// used for wind
const dummy = new THREE.Object3D();
var whiteMat, greyMat;
var fadeMaterial;

let leftDown, rightDown, forwardDown, backwardDown, sailLeftDown, sailRightDown, forwardToggle;
let leftDown2, rightDown2, forwardDown2, backwardDown2, sailLeftDown2, sailRightDown2, forwardToggle2;
forwardToggle = forwardToggle2 = true;
var checkKey = false;
var toggleIndex = 1;
var autoSail = true;
var randomWind = false;

window.addEventListener('load', (event) => {
	init().then(animate);
});

function setup() {
	noCanvas();
}

function fbm(x, y, freq, octaves) {
	let t = 0.0;
	let amp = 1.0;
	let maxAmp = 0.0;
	for (let i = 0; i < octaves; ++i) {
		let n = simplex.noise2D(x * freq, y * freq);
		t += n * amp;

		maxAmp += amp;
		amp *= 0.5; // persistence
		freq *= 2.0; // lacunarity

	}
	return t / maxAmp;
	//return t;
}
function fbmridged(x, y, freq, octaves) {
	let t = 0.0;
	let amp = 1.0;
	let maxAmp = 0.0;
	for (let i = 0; i < octaves; ++i) {
		let n = 1.0 - Math.abs(simplex.noise2D(x * freq, y * freq));
		t += n * amp;

		maxAmp += amp;
		amp *= 0.5; // persistence
		freq *= 2.0; // lacunarity

	}
	return (t - .9) * 1.25;
	//return t;
}

function generateRandom(g) {
	simplex = new SimplexNoise();

	const maxWindSpeed = 1.5;
	for (let y = 0; y < GRIDY; y++) {
		g.push(new Array(GRIDX));
		for (let x = 0; x < GRIDX; x++) {

			let n = fbmridged(x, y, .0035, 2);
			n = (n + 1.0) / 2.0;
			let ns = fbmridged(x + 1751, y + 997, .0025, 5);
			ns *= maxWindSpeed;
			ns = THREE.Math.clamp(ns, .15, maxWindSpeed);
			let p2 = Math.PI * 3;
			g[y][x] = new THREE.Vector2(Math.sin(n * p2) * ns, Math.cos(n * p2) * ns);
		}
	}

}

function generateEmpty(g) {
	// initializing to zero for now
	for (let y = 0; y < GRIDY; y++) {
		g.push(new Array(GRIDX));
		for (let x = 0; x < GRIDX; x++) {
			g[y][x] = new THREE.Vector2(0.0, 0.0);
		}
	}
}

function IsEmptyArrays(g) {
	for (let y = 0; y < GRIDY; y++) {
		for (let x = 0; x < GRIDX; x++) {
			if (g[y][x].x != 0.0 || g[y][x].y != 0.0) {
				return false;
			}
		}
	}
	return true;
}

var simplex;

async function init() {
	document.addEventListener('keydown', keydown);
	document.addEventListener('keyup', keyup);

	GRIDX = Math.trunc(window.innerWidth / SQR);
	GRIDY = Math.trunc(window.innerHeight / SQR);
	lineCount = GRIDX * GRIDY;

	generateEmpty(grid);
	randomGrid();

	generateRandom(targetGrid);
	generateRandom(curGrid);

	scene = new THREE.Scene();
	bufferScene = new THREE.Scene();

	// Make highly-transparent plane
	fadeMaterial = new THREE.MeshBasicMaterial({
		color: 0x000022,
		transparent: true,
		opacity: fadeOpac
	});

	var fadePlane = new THREE.PlaneBufferGeometry(10000, 10000);
	var fadeMesh = new THREE.Mesh(fadePlane, fadeMaterial);
	// Put plane in front of camera
	fadeMesh.position.z = -0.1;
	// Make plane render before particles
	fadeMesh.renderOrder = -1;

	var camGroup = new THREE.Object3D();
	camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -10, 1000);
	//camGroup.add(camera);
	camGroup.add(fadeMesh);

	// Add camGroup to scene
	bufferScene.add(camGroup);

	buffer = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
	var bufferPlane = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight);
	var bufferMaterial = new THREE.MeshBasicMaterial({
		map: buffer.texture,
	});
	bufferMesh = new THREE.Mesh(bufferPlane, bufferMaterial)
	bufferMesh.position.x = window.innerWidth / 2;
	bufferMesh.position.y = window.innerHeight / 2;
	bufferMesh.position.z = - 1000;

	let shipSize = 50;
	var shipPlane = new THREE.PlaneBufferGeometry(shipSize, shipSize);
	var shipSailPlane = new THREE.PlaneBufferGeometry(shipSize, shipSize);

	var shipTexture = await new THREE.TextureLoader().load('/projects/wind/ship.png');
	var shipSailTexture = await new THREE.TextureLoader().load('/projects/wind/shipsail.png');

	var shipMat = new THREE.MeshBasicMaterial({ map: shipTexture });
	shipMat.transparent = true;
	var shipSailMat = new THREE.MeshBasicMaterial({ map: shipSailTexture });
	shipSailMat.transparent = true;

	ship = new Ship(window.innerWidth / 2 - 100, 100, scene, bufferScene, shipPlane, shipMat, shipSailPlane, shipSailMat);
	ship2 = new Ship(window.innerWidth / 2 + 100, 100, scene, bufferScene, shipPlane, shipMat, shipSailPlane, shipSailMat);
	ship2.rot = -1;

	renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClearColor = false;
	document.body.appendChild(renderer.domElement);

	// wind rendering stuff
	const circleGeometry = new THREE.CircleGeometry(1, 8);
	var geometry = new THREE.InstancedBufferGeometry();
	geometry.index = circleGeometry.index;
	geometry.attributes = circleGeometry.attributes;
	whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
	greyMat = new THREE.MeshBasicMaterial({ color: 0xaaaaff });
	circMesh = new THREE.InstancedMesh(geometry, greyMat, circCount);
	circMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
	bufferScene.add(circMesh);

	const positions = [];
	positions.push(0, 0, 0);
	positions.push(1, 1, 0);

	// optional flow field line rendering
	const lineGeo = new THREE.PlaneGeometry(1, 1);
	var lGeo = new THREE.InstancedBufferGeometry();
	lGeo.index = lineGeo.index;
	lGeo.attributes = lineGeo.attributes;
	const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
	lineMesh = new THREE.InstancedMesh(lGeo, lineMat, lineCount);
	lineMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
	//bufferScene.add(lineMesh);

}

let lastTimestamp;
function animate(timestamp) {
	if (lastTimestamp === undefined) {
		lastTimestamp = timestamp;
	}
	const deltaTime = (timestamp - lastTimestamp) / 1000.0;

	render(deltaTime);

	lastTimestamp = timestamp;
	requestAnimationFrame(animate);
}

function render(deltaTime) {
	if (!deltaTime) { // deltaTime is 0, null, or undefined
		deltaTime = 0.016; // Set a default/fallback
	}
	if (isDragging) {
		let gx = Math.trunc(mouseX / SQR);
		let gy = Math.trunc(mouseY / SQR);
		let v = new THREE.Vector2(mouseX - lastX, mouseY - lastY);
		v.normalize();

		let s = brushSize;
		for (let xx = gx - s; xx <= gx + s; xx++) {
			for (let yy = gy - s; yy <= gy + s; yy++) {
				let d = distance(xx, yy, gx, gy);
				if (d <= s) {
					if (checkValidCoord(xx, yy)) {
						if (mouseLeft) { // placer mode
							let w = new THREE.Vector2();
							w.copy(v);
							w.multiplyScalar((1.0 - d / s) * .25);
							let td = distance(mouseX, mouseY, lastX, lastY);
							let cns = 0.025
							w.multiplyScalar((td * cns) * (td * cns)); // scale it by mouse speed but quadratic works better somehow cuz update rate shite i dunno
							grid[yy][xx].add(w);
						} else if (mouseRight){ // eraser mode
							grid[yy][xx].multiplyScalar(0.98);
						}
					}
				}
			}
		}

		lastX = mouseX;
		lastY = mouseY;
	}

	if (changeWindOverTime) {
		frame++;
	}
	for (let y = 0; y < GRIDY; y++) {
		for (let x = 0; x < GRIDX; x++) {
			let nv = new THREE.Vector2(0, 0);
			nv.lerpVectors(grid[y][x], targetGrid[y][x], frame / changeTime);
			curGrid[y][x] = nv;
		}
	}
	lineMesh.instanceMatrix.needsUpdate = true;
	if (frame == changeTime) {
		grid = targetGrid;
		targetGrid = [];
		generateRandom(targetGrid);
		frame = -1;
	}

	//print(winds.length);
	for (let i = 0; i < winds.length; ++i) {
		let w = winds[i];

		let v = getWind(w.x, w.y);
		let vmag = v.length();
		w.vel.lerp(v, 0.2);
		w.x += w.vel.x * 85 * deltaTime; // lines up nicely with boat speed
		w.y += w.vel.y * 85 * deltaTime;
		let targetSize = windEllipseScale * vmag + windMinEllipse;
		w.s = THREE.MathUtils.lerp(w.s, targetSize, 0.2);
		let val = w.life / 20;
		val = THREE.MathUtils.clamp(val, 0, 1);
		val = 1 - val;
		w.s = THREE.MathUtils.lerp(w.s, 0, val);
		dummy.position.set(w.x, w.y, 0);
		dummy.scale.set(w.s, w.s, 1);
		dummy.updateMatrix();

		circMesh.setMatrixAt(i, dummy.matrix);

		w.life--;
		if (w.life < 0) {
			swapAndPop(winds, i);
			i--;
			spawnWind(1);
		}
	}

	if (winds.length < circCount) {
		spawnWind(circCount / 100);
	}
	circMesh.instanceMatrix.needsUpdate = true;

	ship.update(deltaTime, leftDown, rightDown, forwardDown, backwardDown, sailLeftDown, sailRightDown, forwardToggle);
	ship2.update(deltaTime, leftDown2, rightDown2, forwardDown2, backwardDown2, sailLeftDown2, sailRightDown2, forwardToggle2);

	renderer.render(bufferScene, camera); // dont really need this second buffer anymore but whatever
	renderer.render(scene, camera);
}

function Winder(x, y) {
	this.x = x;
	this.y = y;
	this.vel = new THREE.Vector2(0, 0);
	this.s = 0;
	this.life = THREE.MathUtils.randFloat(100, 110);
}

function swapAndPop(array, i) {
	array[i] = array[array.length - 1];
	array.pop();
}

function spawnWind(num = 1) {
	let pad = 0;
	for (let i = 0; i < num; ++i) {
		let x = THREE.MathUtils.randFloat(pad, window.innerWidth - pad);
		let y = THREE.MathUtils.randFloat(pad, window.innerHeight - pad);
		let w = new Winder(x, y);
		winds.push(w);
	}
}

function Ship(startX, startY, scene, bufferScene, shipPlane, shipMat, shipSailPlane, shipSailMat) {
	this.shipMesh = new THREE.Mesh(shipPlane, shipMat);
	this.shipSailMesh = new THREE.Mesh(shipSailPlane, shipSailMat);

	bufferScene.add(this.shipMesh);
	bufferScene.add(this.shipSailMesh);

	this.blueLine = createLine(0x0000ff);
	this.redLine = createLine(0xff0000);
	this.yellowLine = createLine(0xffff00);
	this.greenLine = createLine(0x00ff00);
	this.pinkLine = createLine(0xff00ff);
	scene.add(this.blueLine);
	scene.add(this.redLine);
	scene.add(this.yellowLine);
	scene.add(this.greenLine);
	scene.add(this.pinkLine);

	this.x = startX
	this.y = startY;
	this.vx = 0;
	this.vy = 0;

	this.rot = 0;
	this.sailRot = 0;
	this.turnRate = .03 * 60; // pretty sure this shits in radians

}

Ship.prototype.clampSailRot = function () {
	let pad = .3;
	if (this.sailRot < -Math.PI / 2 + pad) {
		this.sailRot = -Math.PI / 2 + pad;
	}
	if (this.sailRot > Math.PI / 2 - pad) {
		this.sailRot = Math.PI / 2 - pad;
	}
}
Ship.prototype.snapToCardinal = function () {
	let p2 = Math.PI / 2.0;
	this.rot /= p2;
	this.rot = Math.round(this.rot);
	this.rot *= p2;
}

Ship.prototype.update = function (delta, left, right, forward, backward, sailLeft, sailRight, fToggle) {
	if (left) {
		this.rot += this.turnRate * delta;
	}
	if (right) {
		this.rot -= this.turnRate * delta;
	}
	if (sailLeft) {
		this.sailRot += this.turnRate * delta;
	}
	if (sailRight) {
		this.sailRot -= this.turnRate * delta;
	}

	//let d = shipMesh.getWorldDirection();
	let wv = getWind(this.x, this.y);
	let wvm = wv.length();
	wv.normalize();

	let dx = -Math.sin(this.rot);
	let dy = Math.cos(this.rot);
	// boat dir vector
	let dv = new THREE.Vector2(dx, dy);

	// the average between the wind direction and boat direction is the optimal sail angle... pretty sure
	// can also change to just be the wind direction so its simpler for players
	let osv = new THREE.Vector2(dv.x + wv.x, dv.y + wv.y);
	osv.normalize();

	// calculate optimal angle from optimal sail vector
	if (autoSail) {
		let oa = Math.acos(dv.dot(osv));
		let cross = dv.cross(osv);
		if (cross > 0) {
			this.sailRot = oa;
		} else {
			this.sailRot = -oa;
		}
	}

	this.clampSailRot();

	let sdx = -Math.sin(this.rot + this.sailRot);
	let sdy = Math.cos(this.rot + this.sailRot);
	//let wm = wv.length();

	this.shipMesh.position.x = this.x;
	this.shipMesh.position.y = this.y;
	this.shipSailMesh.position.x = this.x;
	this.shipSailMesh.position.y = this.y;
	this.shipMesh.rotation.z = this.rot;
	this.shipSailMesh.rotation.z = this.rot + this.sailRot;

	// sail vector
	let sv = new THREE.Vector2(sdx, sdy).normalize();

	// project the sail vector onto wind vector to see how much were capturing
	// let pf = sv.dot(wv) / wv.dot(wv);
	// let pv = new THREE.Vector2();
	// pv.copy(wv);
	// pv.multiplyScalar(pf);
	// if (pf < 0) {
	// 	pv.x = 0;
	// 	pv.y = 0;
	// }

	// project wind capture vector on ship direction vector to see final movement speed of ship
	// let ff = pv.dot(dv) / dv.dot(dv);
	// let fv = new THREE.Vector2();
	// fv.copy(dv);
	// fv.multiplyScalar(ff);

	// find angle between dv and wv (ship and wind vectors)
	let angleBetween = Math.acos(dv.dot(wv)) / Math.PI * 180;
	let speedAngle = angleBetween / 15.0;
	speedIndex = Math.floor(speedAngle);
	speedFract = speedAngle - speedIndex;

	// find angle between sail vector and optimal sail vector
	let vdot = sv.dot(osv);
	vdot = THREE.MathUtils.clamp(vdot, -1, 1);
	let sailDiffAngle = Math.acos(vdot) / Math.PI * 180;
	// sail mod how much wind is optimally captured
	// stepped so its not annoying to be optimal (as a sailor)
	let sailMod = 0;
	if (sailDiffAngle < 15) {
		sailMod = 1.0;
	} else if (sailDiffAngle < 30) {
		sailMod = 0.85;
	} else if (sailDiffAngle < 60) {
		sailMod = 0.7;
	} else {
		sailMod = 0.5;
	}

	// defines max possible speed based on angle of sail and wind when it has optimal sail
	let s0 = speeds[speedIndex];
	let s1 = speeds[speedIndex + 1];
	let speedMod = THREE.MathUtils.lerp(s0, s1, speedFract);
	let finalScalar = sailMod * speedMod * wvm;

	let bigScale = 100;
	let smallScale = 50;

	let blueLength = bigScale * wvm;

	let finalSpeed = bigScale * finalScalar
	finalSpeed = THREE.MathUtils.clamp(finalSpeed, bigScale * 0.35, finalSpeed);
	let yellowLength = finalSpeed;

	updateLine(this.blueLine, this.x, this.y, this.x + wv.x * blueLength, this.y + wv.y * blueLength);
	updateLine(this.greenLine, this.x, this.y, this.x + sdx * smallScale, this.y + sdy * smallScale);
	updateLine(this.yellowLine, this.x, this.y, this.x + dv.x * yellowLength, this.y + dv.y * yellowLength);
	updateLine(this.redLine, this.x, this.y, this.x + osv.x * smallScale, this.y + osv.y * smallScale);

	let d = delta;
	//let d = 1.0 / 60.0; // rendering kinda looks weird when you try to scale it to different refresh rates
	if (forward || fToggle) {
		this.x += dx * finalSpeed * d;
		this.y += dy * finalSpeed * d;
	}
	if (backward) {
		this.x -= dx * finalSpeed * d;
		this.y -= dy * finalSpeed * d;
	}

	// scroll across screen
	if (this.x < 0) {
		this.x += window.innerWidth;
	}
	if (this.x > window.innerWidth) {
		this.x -= window.innerWidth;
	}
	if (this.y < 0) {
		this.y += window.innerHeight;
	}
	if (this.y > window.innerHeight) {
		this.y -= window.innerHeight;
	}

	// if (checkKey) {
	// 	print("final: " + finalSpeed.toFixed(2));
	// 	print("wind: " + windMod.toFixed(2));
	// 	print("sail: " + sailMod.toFixed(2) + " sailA: " + sailDiffAngle.toFixed(2));
	// 	print("speed: " + speedMod.toFixed(2));
	// 	checkKey = false;
	// }

}

function randomGrid() {
	//checkKey = true;
	if (IsEmptyArrays(grid)) {
		grid = [];
		generateRandom(grid);
	} else {
		grid = [];
		generateEmpty(grid);
	}
}

function keydown(event) {
	//print(event.code);

	if (event.code === "KeyW") {
		forwardDown = true;
	}
	if (event.code === "KeyA") {
		leftDown = true;
	}
	if (event.code === "KeyS") {
		backwardDown = true;
		forwardToggle = false;
	}
	if (event.code === "KeyD") {
		rightDown = true;
	}
	if (event.code === "KeyX") {
		forwardToggle = !forwardToggle;
	}
	if (event.code === "KeyQ") {
		sailLeftDown = true;
		autoSail = false;
	}
	if (event.code === "KeyE") {
		sailRightDown = true;
		autoSail = false;
	}
	if (event.code === "KeyH") {
		let c = document.getElementById("controls");
		c.hidden = !c.hidden;
	}

	if (event.code === "KeyI") {
		forwardDown2 = true;
	}
	if (event.code === "KeyJ") {
		leftDown2 = true;
	}
	if (event.code === "KeyK") {
		backwardDown2 = true;
		forwardToggle2 = false;
	}
	if (event.code === "KeyL") {
		rightDown2 = true;
	}
	if (event.code === "KeyM") {
		forwardToggle2 = !forwardToggle2;
	}
	if (event.code === "KeyU") {
		sailLeftDown2 = true;
		autoSail = false;
	}
	if (event.code === "KeyO") {
		sailRightDown2 = true;
		autoSail = false;
	}
	if (event.code === "KeyR") {
		randomGrid();
	}
	if (event.code === "KeyT") {
		toggleIndex++;
		if (toggleIndex > 2) {
			toggleIndex = 0;
		}
		if (toggleIndex == 0) {
			fadeOpac = 0.20;
		} else if (toggleIndex == 1) {
			fadeOpac = 0.05;
		} else if (toggleIndex == 2) {
			fadeOpac = 0.01;
		}
		fadeMaterial.opacity = fadeOpac;
	}
	if (event.code === "KeyF") {
		autoSail = !autoSail;
	}
	if (event.code === "KeyG") {
		ship.snapToCardinal();
		ship2.snapToCardinal();
	}
	if (event.code === "Space") {
		// changeWindOverTime = !changeWindOverTime;
		// let s = changeWindOverTime ? "IS" : "IS NOT";
		// print("wind " + s + " changing");
		// if (changeWindOverTime) {
		// 	circMesh.material = greyMat;
		// } else {
		// 	circMesh.material = whiteMat;
		// }
	}

}

function getWind(x, y) {
	let wx = Math.floor(x / SQR);
	let wy = Math.floor(y / SQR);
	if (wx < 0) {
		wx = 0;
	}
	if (wx >= grid[0].length) {
		wx = grid[0].length - 1;
	}
	if (wy < 0) {
		wy = 0;
	}
	if (wy >= grid.length) {
		wy = grid.length - 1;
	}

	return curGrid[wy][wx];
}

function checkValidCoord(x, y) {
	return x >= 0 && x < grid[0].length && y >= 0 && y < grid.length;
}

function keyup(event) {
	//print(event.code + " up");

	if (event.code === "KeyW") {
		forwardDown = false;
	}
	if (event.code === "KeyA") {
		leftDown = false;
	}
	if (event.code === "KeyS") {
		backwardDown = false;
	}
	if (event.code === "KeyD") {
		rightDown = false;
	}
	if (event.code === "KeyQ") {
		sailLeftDown = false;
	}
	if (event.code === "KeyE") {
		sailRightDown = false;
	}

	if (event.code === "KeyI") {
		forwardDown2 = false;
	}
	if (event.code === "KeyJ") {
		leftDown2 = false;
	}
	if (event.code === "KeyK") {
		backwardDown2 = false;
	}
	if (event.code === "KeyL") {
		rightDown2 = false;
	}
	if (event.code === "KeyU") {
		sailLeftDown2 = false;
	}
	if (event.code === "KeyO") {
		sailRightDown2 = false;
	}
}

function createLine(col) {
	const lineMat = new THREE.LineBasicMaterial({ color: col });
	const lineGeo = new THREE.BufferGeometry();
	const positions = new Float32Array(2 * 3); // 3 verts per point
	lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	lineGeo.setDrawRange(0, 2);
	return new THREE.Line(lineGeo, lineMat);
}

function updateLine(line, x1, y1, x2, y2, z = 0) {
	let p = line.geometry.attributes.position.array;
	p[0] = x1
	p[1] = y1
	p[2] = z;
	p[3] = x2;
	p[4] = y2;
	p[5] = z;
	line.geometry.attributes.position.needsUpdate = true;
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function print(s) {
	console.log(s);
}

let isDragging = false;
let initialX, initialY;
let lastX, lastY;
const element = document.body;
let mouseLeft = false;
let mouseRight = false;
let brushSize = 10;
let lastUpdateTime;
let mouseX, mouseY;

function GetTimeSeconds() {
	const currentTimeInMilliseconds = Date.now();
	const currentTimeInSeconds = currentTimeInMilliseconds / 1000;
	return currentTimeInSeconds;
}

element.addEventListener('mousedown', (e) => {
	isDragging = true;
	//initialX = e.clientX - element.offsetLeft;
	//initialY = e.clientY - element.offsetTop;
	lastX = e.clientX;;
	lastY = window.innerHeight - e.clientY;;
	element.style.cursor = 'grabbing';
	//print(initialX + " " + initialY);
	mouseLeft = e.button === 0;
	mouseRight = e.button === 2;
	lastUpdateTime = GetTimeSeconds();
});

function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

document.addEventListener('mousemove', (e) => {
	let x = e.clientX;
	let y = window.innerHeight - e.clientY;
	mouseX = x;
	mouseY = y;
});

document.addEventListener('mouseup', () => {
	isDragging = false;
	element.style.cursor = 'grab';
	mouseLeft = false;
	mouseRight = false;
});

element.addEventListener('mouseleave', () => {
	isDragging = false;
	element.style.cursor = 'grab';
});

// prevent right click context menu
document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('wheel', function (event) {
	let scrollAmount = event.deltaY;
	let deltaMode = event.deltaMode;

	if (scrollAmount < 0) {
		brushSize++;
	} else if (scrollAmount > 0) {
		brushSize--;
	}
	if (brushSize < 1) {
		brushSize = 1
	}

});