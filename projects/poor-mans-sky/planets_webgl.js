           
var scene;
var camera;
var camWorldPos;
var renderer;

var planetMat;

var controls;
var clock;
var stats;
var rendererStats;

function initialize(){
	if (Detector.webgl) {
		webGLStart();
	} else {
		var warning = Detector.getWebGLErrorMessage();
		instructions = document.getElementById('instructions');
		span = instructions.getElementsByTagName("span")[0];
		instructions.removeChild(span);
		instructions.appendChild(warning);
		
		controls = document.getElementById("controls");
		controls.parentNode.removeChild(controls);
	}
}

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


/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

var Detector = {

	canvas: !! window.CanvasRenderingContext2D,
	webgl: ( function () {

		try {

			var canvas = document.createElement( 'canvas' ); return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );

		} catch ( e ) {

			return false;

		}

	} )(),
	workers: !! window.Worker,
	fileapi: window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage: function () {

		var element = document.createElement( 'div' );
		element.id = 'webgl-error-message';
		element.style.fontFamily = 'monospace';
		element.style.fontSize = '13px';
		element.style.fontWeight = 'normal';
		element.style.textAlign = 'center';
		element.style.background = '#fff';
		element.style.color = '#000';
		element.style.padding = '1.5em';
		element.style.width = '400px';
		element.style.margin = '5em auto 0';

		if ( ! this.webgl ) {

			element.innerHTML = window.WebGLRenderingContext ? [
				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join( '\n' ) : [
				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join( '\n' );

		}

		return element;

	},

	addGetWebGLMessage: function ( parameters ) {

		var parent, id, element;

		parameters = parameters || {};

		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';

		element = Detector.getWebGLErrorMessage();
		element.id = id;

		parent.appendChild( element );

	}

};

// browserify support
if ( typeof module === 'object' ) {

	module.exports = Detector;

}