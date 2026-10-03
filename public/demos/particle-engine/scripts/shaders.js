var fs_str = '#ifdef GL_ES                                                   \n' +
'precision highp float;                                                      \n' +
'#endif                                                                      \n' +
'                                                                            \n' +
'uniform sampler2D uSampler;                                                 \n' +
'uniform bool uTexOn;                                                        \n' +
'                                                                            \n' +
'varying vec4 vCol;                                                          \n' +
'varying vec2 vTexCoord;                                                     \n' +
'                                                                            \n' +
'void main() {                                                               \n' +
'    // is texture on?                                                       \n' +
'    if(uTexOn) {                                                            \n' +
'		// get texture color                                                 \n' +
'		vec4 texCol = texture2D(uSampler, vec2(vTexCoord.s, vTexCoord.t));   \n' +
'		// multiple by set vertex color, use vertex color alpha              \n' +
'		gl_FragColor = vec4(texCol.rgb*vCol.rgb, vCol.a);                    \n' +
'    }                                                                       \n' +
'    else {                                                                  \n' +
'		// use vertex color                                                  \n' +
'		gl_FragColor = vCol;                                                 \n' +
'    }                                                                       \n' +
'}';																		


var vs_str = 'attribute vec3 aVel;	                           \n' +
'attribute vec3 aVert;                                         \n' +
'attribute float aTime0;                                       \n' +
'attribute vec2 aTexCoord;                                     \n' +
'                                                              \n' +
'uniform mat4 uMVMatrix;                                       \n' +
'uniform mat4 uPMatrix;                                        \n' +
'uniform mat4 bMatrix;                                         \n' +
'uniform float uTime;                                          \n' +
'uniform float uLifeTime;                                      \n' +
'uniform vec4 uColor;                                          \n' +
'                                                              \n' +
'varying vec4 vCol;                                            \n' +
'varying vec2 vTexCoord;                                       \n' +
'                                                              \n' +
'void main() {                                                 \n' +
'    // set point size                                         \n' +
'    gl_PointSize = 4.0;                                       \n' +
'    // set position                                           \n' +
'    float dt = uTime - aTime0;                                \n' +
'    float alpha = clamp(1.0 - 2.0*dt/uLifeTime, 0.0, 1.0);    \n' +
'    if(dt < 0.0 || dt > uLifeTime || alpha < 0.01) {          \n' +
'	// out of sight!                                           \n' +
'	gl_Position = vec4(0.0, 0.0, -1000.0, 1.0);                \n' +
'    }                                                         \n' +
'    else {                                                    \n' +
'	// calculate new position                                  \n' +
'	vec3 accel = vec3(0.0, 0.0, -0.1);                         \n' +
'	// apply a twist                                           \n' +
'	float PI = 3.14159265358979323846264;                      \n' +
'	float theta = mod(100.0*length(aVel)*dt, 360.0)*PI/180.0;  \n' +
'	mat4 rot =  mat4(                                          \n' +
'			 vec4(cos(theta),  sin(theta), 0.0, 0.0),          \n' +
'			 vec4(-sin(theta),  cos(theta), 0.0, 0.0),         \n' +
'			 vec4(0.0,                 0.0, 1.0, 0.0),         \n' +
'			 vec4(0.0,         0.0,         0.0, 1.0)          \n' +
'			 );                                                \n' +
'	vec4 pos2 =  bMatrix*rot*vec4(aVert, 1.0);                 \n' +
'	vec3 newPos = pos2.xyz + aVel*dt + 0.5*accel*dt*dt;   	   \n' +
'	// apply transformations                                   \n' +
'	gl_Position = uPMatrix * uMVMatrix * vec4(newPos, 1.0);    \n' +
'    }                                                         \n' +
'                                                              \n' +
'    // set color                                              \n' +
'    vCol = vec4(uColor.rgb, alpha);                           \n' +
'    vTexCoord = aTexCoord;                                    \n' +
'}';

function loadShaders(callback) {
	var fshader = gl.createShader(gl.FRAGMENT_SHADER);
    var vshader = gl.createShader(gl.VERTEX_SHADER);
    
	// set up compiler
    var compile = function (shader, src) {
        // Send the source to the shader object
        gl.shaderSource(shader, src);
        // Compile the shader program
        gl.compileShader(shader);
        // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			var msg = "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader);
            alert(msg);
			console.log(msg);
        }
    };
	
    // compile shaders
    compile(fshader, fs_str);
    compile(vshader, vs_str);

    // Create the shader program
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vshader);
    gl.attachShader(shaderProgram, fshader);
    gl.linkProgram(shaderProgram);
	
  
	callback(shaderProgram);
}
