
var planetRadius = 200.0;
var numSubdivisions = 4;
var maxDepth = 8;
var updating = true;
var splitList = [];
var roots = [];
var planetType = true;  // true is earthlike, false is 

//http://catlikecoding.com/unity/tutorials/cube-sphere/
function toSphere(v){
    var x2 = v.x*v.x;
    var y2 = v.y*v.y;
    var z2 = v.z*v.z;

    var sx = v.x*Math.sqrt(1-y2/2-z2/2+y2*z2/3);
    var sy = v.y*Math.sqrt(1-x2/2-z2/2+x2*z2/3);
    var sz = v.z*Math.sqrt(1-x2/2-y2/2+x2*y2/3);

    var s = new THREE.Vector3(sx,sy,sz);
    return s;
}

function updatePlanet(){
    if(!updating){
        return;
    }
    camWorldPos = camera.getWorldPosition();
    for(var i = 0; i < 6; ++i){
        roots[i].update();
    }
    var splits = 0;
    var splitsPerFrame = 1;
    while(splits < splitsPerFrame && splitList.length > 0){
        // find and split closest quadtree
        var shortestDist = Number.MAX_VALUE;
        var shortestIndex = 0;
        for(var i = 0; i < splitList.length; ++i){
            var dist = new THREE.Vector3().subVectors(splitList[i].center, camWorldPos).lengthSq();
            if(dist < shortestDist){
                shortestDist = dist;
                shortestIndex = i;
            }
        }
        var qt = splitList.splice(shortestIndex, 1)[0];
        if(qt == null){
            continue;
        }
        qt.onSplitList = false;
        if(qt.shouldSplit()){
            qt.split();
            splits++;
        }
    }
}

function resetPlanet(newSeed){
    if(newSeed){
        noise.seed(Math.random());
    }
    if(roots.length == 6){
       for(var i = 0; i < 6 ; ++i){
            roots[i].recursiveDestroy();
            delete(roots[i]);
        }
        roots = [];
    }
    splitList = [];
    initPlanet();
}

function initPlanet() {
    // 0 -- 3
    // |    |   tl bl br tr
    // 1 -- 2
    // front back left right up down
    startPositions = [];
    startPositions.push([[-1,1,1],[-1,-1,1],[1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]);
    startPositions.push([[1,1,-1],[1,-1,-1],[-1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]);
    startPositions.push([[-1,1,-1],[-1,-1,-1],[-1,-1,1],[-1,-1,1],[-1,1,1],[-1,1,-1]]);
    startPositions.push([[1,1,1],[1,-1,1],[1,-1,-1],[1,-1,-1],[1,1,-1],[1,1,1]]);
    startPositions.push([[-1,1,-1],[-1,1,1],[1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]);
    startPositions.push([[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]);

    for (var i = 0; i < 6; ++i) {
        var qt = new QuadTree(0);
        for(var j = 0; j < 6; ++j){
            var sp = startPositions[i][j];
            qt.verts.push(new THREE.Vector3(sp[0],sp[1],sp[2]));
        }

        for(var j = 0; j < numSubdivisions; ++j){
            qt.subdivide();
        }

        qt.buildMesh();

        roots.push(qt);
    }

}

function initStars(){
    // generate star field
    var numStars = 10000;
    var stargeo = new THREE.BufferGeometry();
    var positions = new Float32Array(numStars*3);
    var colors = new Float32Array(numStars*3);

    var color = new THREE.Color();

    for(var i = 0; i < positions.length; i+=3){
        // get random spherical coordinate
        var theta = Math.random() * Math.PI * 2;
        var phi = Math.acos(2 * Math.random() - 1);
        var r = Math.random() * 50000 + 50000;
        // convert to cartesian
        var x = r * Math.cos(theta) * Math.sin(phi);
        var y = r * Math.sin(theta) * Math.sin(phi);
        var z = r * Math.cos(phi);

        positions[i] = x;
        positions[i+1] = y;
        positions[i+2] = z;

        // generate random star color
        var r = Math.random()*.2 + .8;
        var b = Math.random()*.2 + .8;
        var g = Math.min(r,b);
        color.setRGB(r,g,b);

        colors[i] = color.r;
        colors[i+1] = color.g;
        colors[i+2] = color.b;
    }

    stargeo.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    stargeo.addAttribute('color', new THREE.BufferAttribute(colors,3));

    stargeo.computeBoundingSphere();

    var starmat = new THREE.PointsMaterial({size:1, vertexColors: THREE.VertexColors});
    var stars = new THREE.Points(stargeo, starmat);

    scene.add(stars);

}