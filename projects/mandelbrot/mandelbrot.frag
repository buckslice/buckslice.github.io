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
    vec2 tex = (p.xy) / resolution.y;

    tex *= zoom;
    tex += pos;

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
        color = 0.5 + 0.5*cos(2.7+n*0.3 + vec3(0.0,.6,1.0));
    }

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

	gl_FragColor = vec4(color,1.0);
}