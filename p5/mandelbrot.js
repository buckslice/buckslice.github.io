// a shader variable
let theShader;

function preload() {
    // load the shader
    theShader = loadShader('mandelbrot.vert', 'mandelbrot.frag');
}

let firstFrame = true;
function setup() {
    // shaders require WEBGL mode to work
    createCanvas(windowWidth, windowHeight, WEBGL);
    zoom = 2.5;
    posX = -zoom * windowWidth / windowHeight * 0.5;
    posY = -zoom * 0.5;
    noStroke();
}

let zoom = 0;
let posX = 0;
let posY = 0;
let mouseDown = false;
let lastMouseButton = -1;
function mousePressed(event) {
    mouseDown = true;
    lastMouseButton = event.button;
}
function mouseReleased(event) {
    mouseDown = false;
}
document.oncontextmenu = function () {
    return false;
}

// speed of zooming in and out
const zoomIn = 0.007;
const zoomOut = 0.02;

//let time = 0;
function draw() {

    if (mouseDown || firstFrame) {
        firstFrame = false;
        // shader() sets the active shader with our shader
        shader(theShader);

        let mx = mouseX / windowWidth;
        let my = 1.0 - mouseY / windowHeight;
        let rr = windowWidth / windowHeight;

        let preZoom = zoom;
        if (lastMouseButton == 0) { // Left
            zoom = zoom * (1.0 - zoomIn);

            posX += mx * abs(preZoom - zoom) * rr;
            posY += my * abs(preZoom - zoom);
        } else if (lastMouseButton == 1) { // Middle
            let addx = mouseX - windowWidth / 2.0;
            let addy = mouseY - windowHeight / 2.0;

            posX += addx * 0.00003 * zoom;
            posY -= addy * 0.00003 * zoom;
        } else if (lastMouseButton == 2) { // Right
            zoom = zoom * (1.0 + zoomOut);

            posX -= mx * abs(preZoom - zoom) * rr;
            posY -= my * abs(preZoom - zoom);
        }


        // only clear and redraw if mouse moves that way shader wont run!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // time += 1 / 60.0;
        // theShader.setUniform('iTime', time);

        //console.log(posX + " " + posY);

        // theShader.setUniform('pos', splitDouble(posX))
        // theShader.setUniform('pos2', splitDouble(posY))

        theShader.setUniform('pos', [posX, posY]);
        theShader.setUniform('resolution', [windowWidth, windowHeight]);
        theShader.setUniform('zoom', zoom);

        // rect gives us some geometry on the screen for the shader to use
        // only need to redraw if mouse is down
        rect(0, 0, width, height);
    }
    // print out the framerate
    //  print(frameRate());

}

// function splitDouble(d) {
//     let t = d * (1 << 29) + 1;
//     let thi = t - (t - d);
//     let tlo = d - thi;
//     return [thi, tlo];
// }

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    firstFrame = true;
}
