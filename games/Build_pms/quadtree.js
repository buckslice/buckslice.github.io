class QuadTree {

    constructor(depth) {
        this.depth = depth;
        this.children = [];
        this.neighbors = [];
        this.hasChildren = false;
        this.verts = [];
        this.onSplitList = false;
        this.splitLevel = Math.pow(1.9, -this.depth*1.2 + 12);
        this.splitLevel *= this.splitLevel;
        this.numFloats = 2 * Math.pow(4, numSubdivisions) * 3 * 3;
    }

    subdivide(){
        var newVerts = [];
        //var map = {};

        for(var i = 0; i < this.verts.length; i+=6){
            var v0 = this.verts[i];
            var v1 = this.verts[i+1];
            var v2 = this.verts[i+2];
            var v3 = this.verts[i+4];

            var m01 = new THREE.Vector3().addVectors(v0,v1).multiplyScalar(0.5);
            var m12 = new THREE.Vector3().addVectors(v1,v2).multiplyScalar(0.5);
            var m23 = new THREE.Vector3().addVectors(v2,v3).multiplyScalar(0.5);
            var m30 = new THREE.Vector3().addVectors(v3,v0).multiplyScalar(0.5);
            var m20 = new THREE.Vector3().addVectors(v2,v0).multiplyScalar(0.5);

            newVerts.push(v0,m01,m20,m20,m30,v0,
                          m01,v1,m12,m12,m20,m01,
                          m20,m12,v2,v2,m23,m20,
                          m30,m20,m23,m23,v3,m30);

        }

        this.verts = newVerts;
    }

    buildMesh() {
        var geometry = new THREE.BufferGeometry();

        var positions = new Float32Array( this.numFloats );
        var normals = new Float32Array( this.numFloats );
        var colors = new Float32Array( this.numFloats );

        var norm = new THREE.Vector3();
        var norm2 = new THREE.Vector3();
        var color = new THREE.Color();
        var color2 = new THREE.Color();

        var grad = [];
        if(planetType){
            grad = [.70,new THREE.Color(1.0,1.0,1.0),   // peaks
                    .60,new THREE.Color(0.4,0.4,0.3),   // mountains
                    .35,new THREE.Color(0.0,1.0,0.0),   // grass
                    .27,new THREE.Color(0.8,0.8,0.5),   // coast
                    .26,new THREE.Color(0.0,0.9,0.9),   // shallows
                    .10,new THREE.Color(0.0,0.0,1.0),   // ocean
                    -.6,new THREE.Color(0.0,0.0,0.3)];  // deep ocean
        }else{
            grad = [0.9, new THREE.Color(0.75, 0.2, 0.1),
                    0.5, new THREE.Color(0.7, 0.3, 0.2),
                    0.1, new THREE.Color(0.8, 0.6, 0.1),
                    -.4, new THREE.Color(0.4, 0.1, 0.5),
                    -.6, new THREE.Color(0.2, 0.0, 0.3)];
        }

        var noises = {};    // map for already generated noise values

        var len = this.verts.length;
        for(var i = 0; i < len; ++i){
            var v = toSphere(this.verts[i]);
            var n = 0.0;
            var key = v.x.toPrecision(6) + ',' + v.y.toPrecision(6) + ',' + v.z.toPrecision(6);
            var cachedNoise = noises[key];
            if(cachedNoise){
                n = cachedNoise;
            }else{
                if(planetType){
                    n += noise.fractal3(v.x,v.y,v.z, 7, 2);       // continent noise
                    n += noise.ridged3(v.x,v.y,v.z, 5, 4) * 0.5;     // add interesting ridges
                    n += noise.fractal3(v.x,v.y,v.z, 3, 150) * .02;  // general roughing up
                }else{
                    n += noise.ridged3(v.x,v.y,v.z, 7, 1.5);
                    n += noise.fractal3(v.x,v.y,v.z, 5, 7)*0.5;
                    n += noise.fractal3(v.x,v.y,v.z, 3, 150) * .02;
                }
                noises[key] = n;
            }

            // blend color based on noise and grad
            for(var q = 0; q < grad.length; q+=2){
                if(n > grad[q]){
                    color.set(grad[q+1]);
                    if(q > 0){
                        color2.set(grad[q-1]);
                        color.lerp(color2, noise.cblend(n, grad[q], grad[q-2]));
                    }
                    break;
                }
                color.set(grad[grad.length-1]);
            }

            // switch(Math.floor(i / len * 4)){
            //     case 0:
            //     color.setRGB(1,0,0);
            //     break;
            //     case 1:
            //     color.setRGB(1,1,0);
            //     break;
            //     case 2:
            //     color.setRGB(0,1,0);
            //     break;
            //     case 3:
            //     color.setRGB(0,0,1);
            //     break;
            //     default:
            //     color.setRGB(1,1,1);
            //     break;
            // }
            //color.setRGB(Math.floor(i / len * 4) / 4, 0, 0);    // how splitting will work
            var j = i*3;
            colors[j] = color.r;
            colors[j+1] = color.g;
            colors[j+2] = color.b;

            // make land flat to look like ocean
            //var t = noise.cubic(noise.cblend(n,.27,.35));
            //n = noise.lerp(.27, n-.08, t);
            if(planetType){
                if(n < .27){
                    n = .27;
                }
            }else{
                // if(n > 1.0){
                //     n = 1.0;
                // }
            }

            // scale position a bit by the noise
            v.addScaledVector(v, n * 0.03);
            // scale vertex up based on radius of planet
            v.multiplyScalar(planetRadius);

            positions[j] = v.x;
            positions[j+1] = v.y;
            positions[j+2] = v.z;

            // should add this to save parents generated stuff
            //this.verts[i] = {position: new THREE.Vector3(v.x,v.y,v.z), 
                //color: new THREE.Vector3(color.r, color.g, color.b)};
        }

        // calculate normals
        for(var i = 0; i < this.numFloats; i+=9){
            var v1 = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
            var v2 = new THREE.Vector3(positions[i+3], positions[i+4], positions[i+5]);
            var v3 = new THREE.Vector3(positions[i+6], positions[i+7], positions[i+8]);

            // calculate the normal of this triangle
            norm.subVectors(v1,v2);
            norm2.subVectors(v1,v3);
            norm.cross(norm2);
            norm.normalize();

            normals[i] = norm.x;
            normals[i+1] = norm.y;
            normals[i+2] = norm.z;

            normals[i+3] = norm.x;
            normals[i+4] = norm.y;
            normals[i+5] = norm.z;

            normals[i+6] = norm.x;
            normals[i+7] = norm.y;
            normals[i+8] = norm.z;
        }

        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

        geometry.computeBoundingBox();

        this.center = new THREE.Vector3();
        this.center.subVectors(geometry.boundingBox.max, geometry.boundingBox.min);
        this.center.multiplyScalar(0.5).add(geometry.boundingBox.min);

        this.mesh = new THREE.Mesh(geometry, planetMat);

        scene.add(this.mesh);
    }

    update() {
        if(this.shouldMerge()){
            this.merge();
        }else if(this.shouldSplit() && !this.onSplitList){
            splitList.push(this);
            this.onSplitList = true;
        }

        if(this.hasChildren){
            for(var i = 0; i < 4; ++i){
                this.children[i].update();
            }
        }
    }

    getDistanceToCamera(){
        return new THREE.Vector3().subVectors(this.center, camWorldPos).lengthSq();
    }

    shouldMerge(){
        if(this.hasChildren){
            if(this.children[0].hasChildren ||
               this.children[1].hasChildren ||
               this.children[2].hasChildren ||
               this.children[3].hasChildren){
                return false;
            }
            return this.getDistanceToCamera() > this.splitLevel;
        }
        return false;
    }

    shouldSplit(){
        if(this.hasChildren || this.depth >= maxDepth){
            return false;
        }
        return this.getDistanceToCamera() < this.splitLevel;
    }

    split() {
        var len = this.verts.length;
        for(var i = 0; i < 4; ++i){
            var child = new QuadTree(this.depth + 1);
            for(var j = i*len/4; j < (i+1)*len/4; ++j){
                child.verts.push(this.verts[j]);
            }
            child.subdivide();
            child.buildMesh();
            this.children.push(child);
        }
        this.hasChildren = true;
        this.mesh.visible = false;
    }

    merge() {
        for(var i = 0; i < 4; ++i){
            this.children[i].destroy();
            delete(this.children[i]);
        }
        this.children = [];
        this.hasChildren = false;
        this.mesh.visible = true;
    }

    destroy(){
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
    }

    recursiveDestroy(){
        if(this.hasChildren){
            for(var i = 0; i < 4; ++i){
                this.children[i].recursiveDestroy();
                delete(this.children[i]);
            }
        }
        this.destroy();
    }
}