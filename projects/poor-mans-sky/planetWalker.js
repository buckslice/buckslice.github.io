

planetWalker = function ( camera ) {
    var scope = this;
    this.enabled = false;

    var leftMouseDown = false;
    var rightMouseDown = false;

    var forwardDown = false;
    var backDown = false;
    var leftDown = false;
    var rightDown = false;
    var upDown = false;
    var downDown = false;

    var lookSpeed = 0.002;
    var moveSpeed = 0.002;

    camera.rotation.set( 0, 0, 0 );
    camera.position.set( 0, 0, 0 );

    var yawObject = new THREE.Object3D();
    yawObject.add( camera );

    var mainObject = new THREE.Object3D();
    mainObject.add(yawObject);

    var PI_2 = Math.PI / 2;

    /*DAVIDS CONTRIBUTION BEGINS!!! (BAND PLAYS)*/
    camera.rotation.x = - PI_2;
    /*DAVIDS CONTRIBUTION OVER!!! (SAD MUSIC)*/

    var blocker = document.getElementById( 'blocker' );
    var instructions = document.getElementById( 'instructions' );

    // http://www.html5rocks.com/en/tutorials/pointerlock/intro/
    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    if ( havePointerLock ) {
        var element = document.body;
        var pointerlockchange = function ( event ) {
            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
                scope.enabled = true;
                blocker.style.display = 'none';
            } else {
                scope.enabled = false;
                blocker.style.display = '-webkit-box';
                blocker.style.display = '-moz-box';
                blocker.style.display = 'box';
                instructions.style.display = '';
            }
        };
        var pointerlockerror = function ( event ) {
            instructions.style.display = '';
        };
        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange', pointerlockchange, false );
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'pointerlockerror', pointerlockerror, false );
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
        instructions.addEventListener( 'click', function ( event ) {
            instructions.style.display = 'none';
            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            if ( /Firefox/i.test( navigator.userAgent ) ) {
                var fullscreenchange = function ( event ) {
                    if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
                        document.removeEventListener( 'fullscreenchange', fullscreenchange );
                        document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
                        element.requestPointerLock();
                    }
                };
                document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
                element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
                element.requestFullscreen();
            } else {
                element.requestPointerLock();
            }
        }, false );
    } else {
        instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
    }

    var onMouseMove = function ( event ) {

        if ( scope.enabled === false ) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        camera.rotation.x -= movementY * lookSpeed;
        camera.rotation.x = Math.max( - PI_2, Math.min( PI_2, camera.rotation.x ) );

        yawObject.rotation.y -= movementX * lookSpeed;

    };

    var onMouseDown = function (event){
        if(scope.enabled == false) return;
        scope.enabled = true;
        switch(event.button){
            case 0: leftMouseDown = true; break;
            case 2: rightMouseDown = true; break;
        }
    }

    var onMouseUp = function (event){
        switch(event.button){
            case 0: leftMouseDown = false; break;
            case 2: rightMouseDown = false; break;
        }
    }
    
    var onKeyDown = function (event){
        switch(event.keyCode){
            case 86: // V
                planetMat.wireframe = !planetMat.wireframe; break;
            case 70: // F
                updating = !updating; break;
            case 71: // G
                planetType = !planetType; resetPlanet(true); break;
            case 82: // R
                resetPlanet(true); break;
            case 84: // T
                resetPlanet(false); break;
            case 87: // W
                forwardDown = true; break;
            case 83: // S
                backDown = true; break;
            case 65: // A
                leftDown = true; break;
            case 68: // D
                rightDown = true; break;
            case 32: // SPACE
                upDown = true; break;
            case 16: // SHIFT
                downDown = true; break;
        }
    }

    var onKeyUp = function (event){
        switch(event.keyCode){
            case 87: // W
                forwardDown = false; break;
            case 83: // S
                backDown = false; break;
            case 65: // A
                leftDown = false; break;
            case 68: // D
                rightDown = false; break;
            case 32: // SPACE
                upDown = false; break;
            case 16: // SHIFT
                downDown = false; break;
        }
    }

    this.dispose = function() {
        document.removeEventListener( 'mousemove', onMouseMove, false );
        document.removeEventListener( 'mousedown', onMouseDown, false);
        document.removeEventListener( 'mouseup', onMouseUp, false);
        window.removeEventListener('keydown', onKeyDown, false);
        window.removeEventListener('keyup', onKeyUp, false);
    };
    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mousedown', onMouseDown, false);
    document.addEventListener( 'mouseup', onMouseUp, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);

    this.getObject = function () {
        return mainObject;
    };

    var t = 0;
    this.update = function(delta){
        // rotate object to be upright in relation to gravity
        var planetCenter = new THREE.Vector3(0,0,0);
        var up = new THREE.Vector3().subVectors(planetCenter, mainObject.position).normalize();
        var right = new THREE.Vector3(1,0,0);
        right.applyQuaternion(mainObject.quaternion);
        var forward = new THREE.Vector3().crossVectors(up, right);
        up.negate();
        mainObject.up.copy(up);
        forward.add(mainObject.position);
        mainObject.lookAt(forward);

        // move forward or backward in direction of camera
        // speed based on distance to planet
        var distanceToOrigin = mainObject.position.length()-planetRadius/1.25;
        if(distanceToOrigin < .01){
            distanceToOrigin = .01;
        }
        var speed = delta * distanceToOrigin / 5.0;

        // old mouse look
        //var mouseClick = 0;
        //if(leftMouseDown) mouseClick++;
        //if(rightMouseDown) mouseClick--;
        //var dir = new THREE.Vector3(0,0,-mouseClick*speed);
        //dir.applyQuaternion(camera.getWorldQuaternion());
        //mainObject.position.add(dir);

        var dir = new THREE.Vector3();
        if(forwardDown){
            dir.add(new THREE.Vector3(0,0,-1));
        }
        if(backDown){
            dir.add(new THREE.Vector3(0,0,1));
        }
        if(leftDown){
            dir.add(new THREE.Vector3(-1,0,0));
        }
        if(rightDown){
            dir.add(new THREE.Vector3(1,0,0));
        }
        if(upDown){
            dir.add(new THREE.Vector3(0,1,0));
        }
        if(downDown){
            dir.add(new THREE.Vector3(0,-1,0));
        }

        dir.normalize();
        dir.multiplyScalar(speed);
        dir.applyQuaternion(yawObject.getWorldQuaternion());
        mainObject.position.add(dir);
        
    }

};
