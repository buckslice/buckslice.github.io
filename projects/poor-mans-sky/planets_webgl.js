           
var scene;
var camera;
var camWorldPos;
var renderer;

var planetMat;

var controls;
var clock;
var stats;
var rendererStats;

function webGLStart(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000000 );

    controls = new planetWalker(camera);
    var obj = controls.getObject();
    scene.add(obj);
    //obj.position.z = 350;
    obj.position.z = 2000;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.logarithmicDepthBuffer = true;
    //renderer.setClearColor(0x0000ff);     // setting to blue for testing
    document.body.appendChild( renderer.domElement );

    window.addEventListener('resize', onWindowResize, false);

    // add a point light for sun
    var sun = new THREE.PointLight(0xffffff, 0.8, 0);
    sun.position.set(10000,10000,10000);
    scene.add(sun);

    var moon = new THREE.PointLight(0x555577, 0.8, 0);
    moon.position.set(-10000,-10000,-10000);
    scene.add(moon);

    // add ambient light
    scene.add(new THREE.AmbientLight(0x111111));

    clock = new THREE.Clock();

    stats = new Stats();
    var ctrls = document.getElementById("controls");
    ctrls.insertBefore(stats.dom, ctrls.firstChild);

    rendererStats = new THREEx.RendererStats()
    ctrls.insertBefore(rendererStats.domElement, ctrls.firstChild);

    // global material that all quadtrees will use
    planetMat = new THREE.MeshPhongMaterial( {
        color: 0xaaaaaa, specular: 0xffffff, shininess: 0.0,
        side: THREE.DoubleSide, // THREE.FrontSide 
        vertexColors: THREE.VertexColors,
        //wireframe: true
    } ); 

    initStars();
    resetPlanet(true);

    render();
}

function render() {
    requestAnimationFrame( render );

    var delta = clock.getDelta();

    renderer.render(scene, camera);

    controls.update(delta);

    updatePlanet();

    stats.update();
    rendererStats.update(renderer);
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}