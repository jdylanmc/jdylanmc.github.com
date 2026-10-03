// global GL context
var gl;

var ps_red = 128;
var ps_green = 128;
var ps_blue = 128;
var canvasBackgroundColor = 0.0;// either 0 or 1
var particle_angle = 360.0;		// between 1 and 360
var particle_force = 1; 		// between .001 and 2.0
var particle_speed = .1; 		// between .01 and .2
var particle_spawn = .099; 		// between .001 and 1
var refresh_speed = 500;		// between 50 and 1000
var particle_size = 1.0; 		// between 0.01 and 1
var particle_lifetime = 30.0; 	// between 1.0 and 40.0
var billboard = false;
var particle_enable_texture = false;
var particle_texture = "images/star.png";

// global shader object
var program = {};

var particleInitializeCount = 1000;	// not connected to UI

var view = {
	eye:[10.0, 10.0, 10.0],
	dir:[-1.0, -1.0, -1.0],
	up:	[0.0, 0.0, 1.0]
};

// extension to mat3
mat3.setByRows = function (R1, R2, R3) {
    var mat = this.create();
    mat[0] = R1[0];
    mat[1] = R1[1];
    mat[2] = R1[2];
    mat[3] = R2[0];
    mat[4] = R2[1];
    mat[5] = R2[2];
    mat[6] = R3[0]
    mat[7] = R3[1];
    mat[8] = R3[2];
    return mat;
};

// make a Particle System object
function ParticleSystem(numP) {

	var PS = {};

	// program object
	PS.prog = {};

	// number of particles
	PS.numP = numP;

	PS.render = function () {};
	
	PS.vertices = [];
	PS.texcoords = [];
	PS.velocities = [];
	PS.zeroTimes = [];

	// define a callback function to be called after loading shaders
	var Run = function (prog) {
		// set program
		PS.prog = prog;

		// initialize texture information
		PS.texture = gl.createTexture();
		PS.texture.image = new Image();
		PS.texture.image.onload = function () {
			gl.bindTexture(gl.TEXTURE_2D, PS.texture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, PS.texture.image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}

		PS.texture.image.src = particle_texture;	
		
		// uniforms
		PS.timeU = gl.getUniformLocation(PS.prog, "uTime");				// together these two
		PS.lifeTimeU = gl.getUniformLocation(PS.prog, "uLifeTime");		// make everything move
		PS.pMatrixUniform = gl.getUniformLocation(PS.prog, "uPMatrix");
		PS.mvMatrixUniform = gl.getUniformLocation(PS.prog, "uMVMatrix");
		PS.bMatrixU = gl.getUniformLocation(PS.prog, "bMatrix");
		PS.colorU = gl.getUniformLocation(PS.prog, "uColor");
		PS.samplerU = gl.getUniformLocation(PS.prog, "uSampler");
		PS.texOnU = gl.getUniformLocation(PS.prog, "uTexOn");
		
		// attributes
		PS.vertIndex = gl.getAttribLocation(PS.prog, "aVert");
		PS.texIndex = gl.getAttribLocation(PS.prog, "aTexCoord");
		PS.time0Index = gl.getAttribLocation(PS.prog, "aTime0");
		PS.velIndex = gl.getAttribLocation(PS.prog, "aVel");
		
		// define particle shapes
		var particleShape = [
			-particle_size,  particle_size, 0.0,
			-particle_size, -particle_size, 0.0,
			 particle_size,  particle_size, 0.0,
			 particle_size,  particle_size, 0.0,
			-particle_size, -particle_size, 0.0,
			 particle_size, -particle_size, 0.0
		];
		
		// define texture coordinates
		var tex_c = [
			0.0, 1.0,
			0.0, 0.0,
			1.0, 1.0,
			1.0, 1.0,
			0.0, 0.0,
			1.0, 0.0
		];

		// the "set up" function
		PS.execute = function (numParticles) {
			// set no. of particles
			this.numP = numParticles;

			// time variables
			this.t = 0.0;
			this.tStart = new Date().getTime();
			this.startPos = [2.0, 2.0, 0.0];
			

			// set up particles
			for (var i = 0; i < numParticles; i++) {
				for (var j = 0; j < 3 * 6; j++) {
					PS.vertices.push(particleShape[j]);
				}
				
				for (var j = 0; j < 2 * 6; j++) {
					PS.texcoords.push(tex_c[j]);
				}
				
				var angle = particle_angle * Math.PI / 180.0;
				var a = Math.random() * angle;
				var t = Math.random() * (particle_angle * Math.PI / 180.0);
				var x = Math.sin(a) * Math.cos(t);
				var y = Math.sin(a) * Math.sin(t);
				var z = Math.cos(a);
				var angleRatio = a / angle;
				var speed = 1 * (particle_force - angleRatio * angleRatio);
				var vel = [speed * x, speed * y, speed * z];

				for (var j = 0; j < 6; j++) {
					PS.velocities.push(vel[0]);
					PS.velocities.push(vel[1]);
					PS.velocities.push(vel[2]);
					PS.zeroTimes.push(particle_spawn * i);
				}
			}

			// push data to shaders
			this.vertBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PS.vertices), gl.STATIC_DRAW);

			this.velBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.velBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PS.velocities), gl.STATIC_DRAW);
			
			this.texBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PS.texcoords), gl.STATIC_DRAW);

			this.timeBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.timeBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PS.zeroTimes), gl.STATIC_DRAW);
		};
		

		// render method
		PS.render = function (pMatrix, mvMatrix) {
			// sanity check
			if (!this.prog)
				return;				
				
			this.t = this.t + particle_speed;
			
			// color
			this.col0 = [ps_red, ps_green, ps_blue, 1.0];
			
			// use shader
			gl.useProgram(this.prog);

			// enable arrays
			gl.enableVertexAttribArray(this.vertIndex);
			gl.enableVertexAttribArray(this.texIndex);
			gl.enableVertexAttribArray(this.time0Index);
			gl.enableVertexAttribArray(this.velIndex);

			// set matrices
			gl.uniformMatrix4fv(this.pMatrixUniform, false, pMatrix);
			gl.uniformMatrix4fv(this.mvMatrixUniform, false, mvMatrix);

			// billboarding logic
			if (billboard) {
				var N = vec3.create(view.dir);
				vec3.normalize(N);
				var U = vec3.create(view.up);
				vec3.normalize(U);
				var R = vec3.cross(U, N);
				vec3.normalize(R);
				var U2 = vec3.cross(N, R);
				var bMatrix = mat3.toMat4(mat3.setByRows(N, R, U2));
				gl.uniformMatrix4fv(this.bMatrixU, false, bMatrix);
			}
			else {
				var bMatrix = mat3.create();
				mat3.identity(bMatrix);
				gl.uniformMatrix4fv(this.bMatrixU, false, mat3.toMat4(bMatrix));				
			}
			
			// set time
			gl.uniform1f(this.timeU, this.t);

			//set lifetime
			gl.uniform1f(this.lifeTimeU, particle_lifetime);

			// set color
			gl.uniform4fv(this.colorU, this.col0);

			// set buffers
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
			gl.vertexAttribPointer(this.vertIndex, 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
			gl.vertexAttribPointer(this.texIndex, 2, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.timeBuffer);
			gl.vertexAttribPointer(this.time0Index, 1, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.velBuffer);
			gl.vertexAttribPointer(this.velIndex, 3, gl.FLOAT, false, 0, 0);

			// rendering code if user wants textures applied
			if (particle_enable_texture) {
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.texture);
				gl.uniform1i(this.samplerU, 0);
				gl.uniform1i(this.texOnU, 1);
			}
			
			// draw
			gl.drawArrays(gl.TRIANGLES, 0, 6 * this.numP);

			gl.depthMask(true);
			

			// cleanup
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.uniform1i(this.texOnU, 0);
			gl.disableVertexAttribArray(this.vertIndex);
			gl.disableVertexAttribArray(this.texIndex);
			gl.disableVertexAttribArray(this.time0Index);
			gl.disableVertexAttribArray(this.velIndex);
		};

		PS.execute(numP);

		return PS;
	};

	// load shaders, then call Run
	loadShaders(Run);

	return PS;
}


// initialize WebGL canvas
function initCanvas() {
	program.canvas = null;
	
	try {
		var canvas = document.getElementById("webgl");
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		program.canvas = canvas;
	} catch (err) {
		alert("Could not initialize WebGL.");
	}
}


function initGL() {
	program.ps = ParticleSystem(particleInitializeCount);

	program.pMatrix = mat4.create();

	// set time
	program.t = 0.0;
}




function draw() {
	try {
		gl.clearColor(canvasBackgroundColor, canvasBackgroundColor, canvasBackgroundColor, 1.0);
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// set projection matrix
		mat4.perspective(45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, program.pMatrix);

		var center = [view.eye[0] + 1.0 * view.dir[0],
					  view.eye[1] + 1.0 * view.dir[1],
					  view.eye[2] + 1.0 * view.dir[2]];

		// transparency (only if background color is black)
		if (canvasBackgroundColor == 0.0) {
			gl.enable(gl.BLEND);			
		}
		else {
			gl.disable(gl.BLEND);	
		}
	
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		
		program.ps.render(program.pMatrix, mat4.lookAt(view.eye, center, view.up));
		
	} catch (e) {
		alert("Error: " + e);
	}
}

function tick() {
	requestAnimFrame(tick);

	program.t = program.t + 1;
	
	if ((program.t % refresh_speed) == 0) {
		ReloadWebGL();
	}

	draw();
}

function ReloadWebGL() {
	program.ps = ParticleSystem(particleInitializeCount);
	program.ps.execute(particleInitializeCount);
	program.t = 0.0;
}

function RunWebGL() {
	initCanvas();
	initGL();
	tick();
}



