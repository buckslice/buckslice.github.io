// These are necessary definitions that let you graphics card know how to render the shader
#ifdef GL_ES
precision highp float;
#endif

// grab our textures coordinates from vert shader
varying vec2 vTexCoord;

uniform vec2 resolution;
uniform vec2 pos;
uniform float zoom;

#define ITERS 256

vec3 mandelbrot(vec2 p){
    //vec2 mm = mouse / resolution;
    //vec2 zvec = vec2(rr*mm.x,mm.y);
    vec2 tex = (p.xy) / resolution.y;
    //float rr = resolution.x / resolution.y;
    //tex -= vec2(rr*1.0, 1.0);
    //tex -= resolution.y / resolution.x * zoom;
    // tex.x -= gl_FragCoord.x / resolution.y * 0.5;
    // tex.y -= gl_FragCoord.y / resolution.y * 0.5;
    tex *= zoom;
    tex += pos;
    //tex += vec2(rr*1.0, 1.0);
    //tex += zvec;
    vec2 z = vec2(0.0,0.0);
    float n = float(ITERS);
    const float R = 4.0;
    const float R2 = R*R;
    const float LG2R = log2(R);
    for(int i = 0; i < ITERS; ++i){
        if(dot(z,z) > R2){
            n = float(i);
            // add partial iteration
            //n += 1.0 - (1.0 / sqrt(z.x*z.x + z.y*z.y)) / 1.0;
            //n += 1.0 - log2(sqrt(z.x*z.x + z.y*z.y));
            n -= 1.0+log2(log2(sqrt(z.x*z.x + z.y*z.y))/LG2R);
            break;
        }
        // x is real, y is imaginary
        float zim2 = z.y*z.y;
        z.y = 2.0*z.x*z.y + tex.y;
        z.x = z.x*z.x - zim2 + tex.x;
    }



    vec3 color = vec3(0.0,0.0,0.0);
    if(n < float(ITERS)){
        
        //n *= 0.1;
        //color = vec3(sin(n), sin(n+2.094), sin(n + 4.188)) * 0.5 + 0.5;

        color = 0.5 + 0.5*cos(2.7+n*0.3 + vec3(0.0,.6,1.0));


        // n *= 0.1;
        // color = vec3(0,0, sin(n)) * 0.5 ;

        //color = vec3(1,1,1);
        
        //color = vec3(vTexCoord.x,0.0, vTexCoord.y);
        //color = vec3(sin(n),0.0,0.0);
    }


    //vec3 color = vec3((sin(vTexCoord.x + mouse.x)+1.0)/2.0, 0.0, 0.0);

    // gl_FragColor is a built in shader variable, and you .frag file must contain it
    // We are setting the vec3 color into a new vec4, with an transparency of 1 (no opacity)
    return color;
}


//http://warp.povusers.org/Mandelbrot/
void main() {

    vec3 color = vec3(0);
	// anti-aliasing
	color  = mandelbrot( gl_FragCoord.xy + vec2(0,0) );
	color += mandelbrot( gl_FragCoord.xy + vec2(.5,.0) );
	color += mandelbrot( gl_FragCoord.xy + vec2(.0,.5) );
	color += mandelbrot( gl_FragCoord.xy + vec2(.5,.5) );
	color /= 4.0;

	//color = pow(color,vec3(1.0/2.2));

	gl_FragColor = vec4(color,1.0);
}


// this has a double precision version using 2 floats per double kinda scuffedly
// but couldnt get it working with panning by the mouse. it messes it up no matter wat i do, tried some float addition calcs
//https://www.shadertoy.com/view/XdsXWN

// // These are necessary definitions that let you graphics card know how to render the shader
// #ifdef GL_ES
// precision highp float;
// #endif
// // webgl mandelbrot shader test
// // by Franc[e]sco
// // adapted by TekF

// // my work & home PCs get very different results, so toggle some things
// // it seems to be caused by the precision of the pan value
// #if (1)
// 	// Work PC (GeForce GTX 770)
// 	const vec4 pan = vec4(-0.31750109, 0.48999993, 0.00000000000000588, .0);
// 	const float period = 175.0; // higher quality results at this position, so can zoom closer
// #else
// 	//Home PC (Radeon HD 7700)
// 	const vec4 pan = vec4(-0.3175011, 0.49, .00000000011, .0);
// 	const float period = 142.0;
// #endif

// //const vec4 pan = vec4(-0.300853, 0.441, 0.00000000000000032, -0.0000000000238951); // does anyone have a good point to zoom on?
// //const vec4 pan = vec4(-0.3151, 0.445, 0, -.000000013);

// uniform float zoom;
// uniform vec2 pos;
// uniform vec2 pos2;
// uniform vec2 resolution;
// uniform float iTime;

// const int maxIterations = 256;
// const vec3 colourPhase = vec3(5,7,11)/80.0;
// const vec3 colourPhaseStart = vec3(1);

// const float initialZoom = 3.5;


// vec2 DoubleMul( vec2 a, vec2 b )
// {
// 	vec2 c;
// 	// c = a*b
// 	// (c.y+c.x) = (a.x+a.y)*(b.x+b.y);
// 	c.y = a.y*b.y; // smallest part
// 	float l = a.x*b.x; // largest part
// 	float r = a.x*b.y + a.y*b.x; // part in-between.
// 	// if we add it to the big, it might lose precision in the middle of the number
// 	// which would be as bad as a float, so:

// // trying out some ideas to make the "doubles" more robust:
	
// // try to add it to c.x, and detect how much underflowed to add to c.y
// // I don't expect this will work, because the compiler will optimise it out
// /*c.x = l+r;
// float rf = c.x-l; // the part of r that actually made it after rounding.
// r = r - rf;
// c.y += r;*/
// // note that a.x*b.x already underflows, so using the full precision will make that a more serious problem.
// // => need upper & lower halfs of .x's... uh...

// c.x = l;
// c.y += r;

// /*
// This introduces more errors!
// could try taking the difference between c.x and c.x+r, and that remainder is the value to add to c.y
// // do something more robust, otherwise the vals can both lose too much precision
// 	float cp = log2(abs(c.x));
// 	float rp = log2(abs(r));
// 	const float precis = 20.0;
// 	if ( rp > cp-precis )
// 	{
// 		// chop rp up into 2 bits, put the bigger bits in the top val
// 		float cut = exp2(cp-precis);
// 		float r2 = fract(r/cut)*cut;
// 		c.y += r2;
// 		c.x += r-r2;
// 	}
// 	else
// 	{
// 		c.y += r;
// 	}
// */
// 	return c;
// }

// vec2 quickTwoSum(float a, float b){
//     float s = a + b;
//     float e = b - (s-a);
//     return vec2(s,e);
// }
// vec2 twoSum(float a, float b){
//     float s = a + b;
//     float v = s - a;
//     float e = (a - (s - v)) + (b - v);
//     return vec2(s, e);
// }
// vec2 dAdd(vec2 a, vec2 b){
//     vec2 s, t;
//     s = twoSum(a.x, b.x);
//     t = twoSum(a.y, b.y);
//     s.y += t.x;
//     s = quickTwoSum(s.x, s.y);
//     s.y += t.y;
//     s = quickTwoSum(s.x, s.y);
//     return s;
// }

// vec3 fractal( vec2 p ) {
	
// 	// randomly tweaked the calculations for semi-constant zooming
// 	// I don't really know what I'm doing here, but it works
// 	//float T = abs(fract((iTime/period)*.5+.5)*2.0-1.0001)*period; // using exactly 1.0 breaks it, I don't know why
// 	//float zz = pow(initialZoom, (-T + initialZoom + 1.0) / 3.0);

// 	vec4 Z = vec4(0), C = vec4(0);
// 	int iterations;
// 	bool ignore = false;
	
// 	// convert to texels, center the set on screen and apply zoom
// 	vec2 pixel;
// 	pixel = (p / resolution.xy - 0.5) * zoom; 
// 	pixel.y /= resolution.x/resolution.y; // fix aspect ratio

// 	//float a = iTime*.05;
// 	//pixel = pixel*cos(a)+vec2(1,-1)*sin(a)*pixel.yx;


//     //vec2 tex = p / resolution.y * zoom;
//     //float rr = resolution.x / resolution.y;
//     //tex -= vec2(rr*1.0, 1.0);
//     //tex -= resolution.y / resolution.x * zoom;
//     // tex.x -= gl_FragCoord.x / resolution.y * 0.5;
//     // tex.y -= gl_FragCoord.y / resolution.y * 0.5;
//     //tex += pos;

// // to see the limit of floats, set xy instead of zw here!	
// 	C.zw = pixel;
	
// 	C -= pan;


//     //C += vec4(pos.x,pos.y,0,0);
//     //C += vec4(0, 0, dAdd(vec2(pos.y,pos2.y),vec2(pos.x,pos2.x)));
//     //C += vec4(pos.x, pos2.x, pos.y, pos2.y);

//     //C += vec4(pos.x, pos2.x, pos.y, pos2.y);

//     //C += vec4(dAdd(vec2(pos.x,pos2.x),vec2(pos.y,pos2.y)), 0, 0);
//     C += vec4(twoSum(pos.x, pos.y)+twoSum(pos2.x, pos2.y), 0, 0);
	
// 	for (int i = 0; i < maxIterations; i++) {
// 		if (ignore)
// 			break;
		
// 		// complex number operations
// 		// Z = Z*Z + C
// 		vec4 Z2;
// 		//Z.x * Z.x - Z.y * Z.y, 
// 		Z2.xz = DoubleMul(Z.xz,Z.xz) - DoubleMul(Z.yw,Z.yw);
// 		Z2.yw = 2.0*DoubleMul(Z.xz,Z.yw);
// 		Z = Z2 + C; // apply panning
		
// 		// stop immediately if the point is outside a radius of 2 from (0,0) (the bounds of the mandelbrot set)
// 		//if ( dot((DoubleMul(Z.xz,Z.xz) + DoubleMul(Z.yw,Z.yw)),vec2(1)) > 4.0 ) // smooth
// 		if ( max(abs(dot(Z.xz,vec2(1))),abs(dot(Z.yw,vec2(1)))) > 2.0 ) // scallops
// 			ignore = true;
		
// 		iterations = i;
// 	}
	
// 	//return pow(sin(colourPhase.xyz * float(iterations) + colourPhaseStart)*.5+.5,vec3(2.2));
// 	return pow(sin(colourPhase.xyz * float(iterations) + colourPhaseStart)*.5+.5,vec3(1.5));
// 	//return 1.0-abs(sin(colourPhase.xyz * float(iterations) + colourPhaseStart));//*.5+.5;
// }


// void main()
// {
// 	//fragColor.rgb  = fractal( fragCoord.xy + vec2(0,0) );
//     vec3 color = vec3(0);
// 	// anti-aliasing
// 	color  = fractal( gl_FragCoord.xy + vec2(0,0) );
// 	// color += fractal( gl_FragCoord.xy + vec2(.5,.0) );
// 	// color += fractal( gl_FragCoord.xy + vec2(.0,.5) );
// 	// color += fractal( gl_FragCoord.xy + vec2(.5,.5) );
// 	// color /= 4.0;
	
// /*	fragColor.rgb += fractal( fragCoord.xy + vec2(.25,.25) );
// 	fragColor.rgb += fractal( fragCoord.xy + vec2(.75,.25) );
// 	fragColor.rgb += fractal( fragCoord.xy + vec2(.25,.75) );
// 	fragColor.rgb += fractal( fragCoord.xy + vec2(.75,.75) );
// 	fragColor.rgb /= 8.0;*/
	
// 	color = pow(color,vec3(1.0/2.2));

// 	gl_FragColor = vec4(color,1.0);
// }
