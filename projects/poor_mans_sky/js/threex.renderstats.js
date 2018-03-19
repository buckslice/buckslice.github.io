
// credit to mrdoob and jetienne
// edited by johnnyboy
var THREEx	= THREEx || {}

THREEx.RendererStats	= function (){

	var msMin	= 100;
	var msMax	= 0;

	var container	= document.createElement( 'div' );
	container.style.cssText = 'width:175px;opacity:0.9;cursor:pointer';

	var msDiv	= document.createElement( 'div' );
	msDiv.style.cssText = 'padding:0 3px 3px 3px;text-align:left;background-color:#200;';
	container.appendChild( msDiv );

	var msText	= document.createElement( 'div' );
	msText.style.cssText = 'color:#f00;line-height:15px';
	msText.innerHTML= 'RENDER STATS       ';
	msDiv.appendChild( msText );
	
	var msTexts	= [];
	var nLines	= 4;
	for(var i = 0; i < nLines; i++){
		msTexts[i]	= document.createElement( 'div' );
		msTexts[i].style.cssText = 'color:#f00;background-color:#311;line-height:15px';
		msDiv.appendChild( msTexts[i] );		
		msTexts[i].innerHTML= '-';
	}


	var lastTime	= Date.now();
	return {
		domElement: container,

		update: function(webGLRenderer){
			// sanity check
			console.assert(webGLRenderer instanceof THREE.WebGLRenderer)

			// refresh only 30time per second
			if( Date.now() - lastTime < 1000/30 )	return;
			lastTime	= Date.now()

			var i	= 0;
			msTexts[i++].textContent = "Geometries: "+ webGLRenderer.info.memory.geometries;
			msTexts[i++].textContent = "Draw Calls: "+ webGLRenderer.info.render.calls;
			msTexts[i++].textContent = "Vertices  : "+ webGLRenderer.info.render.vertices;
			msTexts[i++].textContent = "Faces     : "+ webGLRenderer.info.render.faces;
			// can add in more lines if needed for other render infos
		}
	}	
};