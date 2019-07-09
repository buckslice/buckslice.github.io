// trying to emulate the effect from the part of this sweet vid at 5:08
//https://www.youtube.com/watch?v=S1TQCi9axzg
// loosely based off this vid as well
//https://www.youtube.com/watch?v=S1TQCi9axzg

var symbolSize = 26;
var streams = [];
var counter = 0;
var sidePad = 400;
var colorA;
var colorB;

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    background(0);
    textSize(symbolSize);
    frameRate(30);
    //textFont('Consolas');

    //colorA = color(60,33,18);
    colorA = color(100, 70, 20);
    colorB = color(130, 90, 30);

    let x = 0;
    let y = 0;
    for (let i = 0; i <= height / symbolSize; ++i) {
        let stream = new Stream(0, y + 20);
        stream.padSymbols();
        streams.push(stream);
        y += symbolSize;
    }
}

function draw() {
    background(53, 28, 14, 150);

    if (frameCount % 2 == 0) {
        counter += 1;
        for (let i = 0; i < streams.length; ++i) {
            if ((i + counter) % 30 == 0) {
                let moveAmount = random(100, 200);
                if (streams[i].x > 0) {
                    streams[i].lerpMove(-moveAmount);
                } else if (streams[i].x < -sidePad) {
                    streams[i].lerpMove(moveAmount);
                } else {
                    if (random() < 0.5) {
                        streams[i].lerpMove(-moveAmount);
                    } else {
                        streams[i].lerpMove(moveAmount);
                    }
                }
            }
        }
    }


    for (let i = 0; i < streams.length; ++i) {
        streams[i].render();
    }
}

String.prototype.replaceAt = function (index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

GetRandomSymbol = function () {
    if (random(0, 3) < 2) {
        return " ";
    }
    if (random(0, 5) < 1) {
        return String.fromCharCode(0x0021 + round(random(0, 24)));
    }
    //return String.fromCharCode(round(random(0, 1112064)));
    //return String.fromCharCode(0x30A0 + round(random(0, 96)));
    return String.fromCharCode(0x2200 + round(random(0, 256)));
}

function Stream(x, y) {
    this.x = x - sidePad / 2;
    this.y = y;
    this.text = "";
    this.startX = this.x;
    this.time = 2.0;
    this.move = 0.0;
    this.width = 0;
    this.brokeHalf = false;
    //this.speed = random(0, 3);
}

Stream.prototype.padSymbols = function () {
    this.width = textWidth(this.text);
    while (this.width < width + sidePad) {
        this.text += GetRandomSymbol();
        this.width = textWidth(this.text);
    }
}

Stream.prototype.changeRandomSymbols = function () {
    for (let i = 0; i < this.text.length; ++i) {
        if (random() < 0.2) {
            this.text = this.text.replaceAt(i, GetRandomSymbol());
        }
    }
    this.padSymbols();
}

Stream.prototype.lerpMove = function (move) {
    this.startX = this.x;
    this.time = 0.0;
    this.move = move;
    this.brokeHalf = false;
}

Stream.prototype.render = function () {
    if (this.time < 1.0) {
        this.time += 0.03;
        if (this.time > 0.5 && !this.brokeHalf) {
            this.brokeHalf = true;
            this.changeRandomSymbols();
        }
        if (this.time > 1.0) {
            this.time = 1.0;
        }

        fill(lerpColor(colorA, colorB, 1.0 - abs(cos(this.time * PI))));

        this.x = this.startX + InOutQuart(this.time) * this.move;
    } else {
        if(random() < 0.01){
            //this.changeRandomSymbols();
        }
        //fill(1,1,1);
        fill(colorA);
    }

    text(this.text, this.x, this.y);
}

InOutQuart = function (t) {
    return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
}
