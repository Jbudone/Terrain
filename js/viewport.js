
var 	viewport = null,
		viewportCanvas = document.getElementById('viewport'),
		gl = viewportCanvas.getContext("webgl") || viewportCanvas.getContext("experimental-webgl"),
		glShader = {
			main: {
				program: null,
				vertexShader: null,
				fragmentShader: null
			},
			skybox: {
				program: null,
				vertexShader: null,
				fragmentShader: null
			}
	},  Settings = {
			framerate: 45,
			pointRadius: 0.02,
			fov: 45,
			nearPlane: 1,
			farPlane: 50000.0,
			canvasWidth: null,
			canvasHeight: null,
			aspectRatio: null,
			scaleXZ: 1.0,
			useLOD: false
	},  Objects = {
			camera:{
				position:new THREE.Vector3(0,0,0),
			},
			quads:{ },
			thingy:null,
			points:[],
			selected:null,
			curve:[]
	},  Buffer = {
			points:null,
			curve:null,
			selected:null,
			skybox:null
	},  Shaders = {
			main: {
				'fragment':{
					'type':null,
					'id':'shader-fs'
				},
				'vertex':{
					'type':null,
					'id':'shader-vs',
					'attributes':{
						'aVertexPosition':null,
						'aVertexSlope':null
					}
				}
			},
			skybox: {
				'fragment':{
					'type':null,
					'id':'skybox-fs'
				},
				'vertex':{
					'type':null,
					'id':'skybox-vs',
					'attributes':{
						'aVertexCoord':null,
						'aTexCoord':null,
					}
				}
			}
	},	Textures = {
			main: [
					{src: "ageofcanyon.jpg", sampler: null},
					{src: "faultzone.jpg", sampler: null},
					{src: "barrenreds.jpg", sampler: null},
					{src: "deepcave.jpg", sampler: null},
					{src: "grass.jpg", sampler: null},
					{src: "gravel.jpg", sampler: null} ],
			skybox: [

						{ sampler: null, options: { skip: false }, cubemap: [
							{ src: "FullMoon/FullMoonUp2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
							{ src: "FullMoon/FullMoonDown2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
							{ src: "FullMoon/FullMoonLeft2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
							{ src: "FullMoon/FullMoonRight2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
							{ src: "FullMoon/FullMoonFront2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
							{ src: "FullMoon/FullMoonBack2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
						] },

						{ sampler: null, options: { skip: true }, cubemap: [
							{ src: "SunSet/SunSetUp2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
							{ src: "SunSet/SunSetDown2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
							{ src: "SunSet/SunSetLeft2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
							{ src: "SunSet/SunSetRight2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
							{ src: "SunSet/SunSetFront2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
							{ src: "SunSet/SunSetBack2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
						] },

			
					]
	};



	var initViewport = function(){



		// Grab webgl context if possible; otherwise try fallback (experimental webgl)
		viewportCanvas = document.getElementById('viewport');
		gl = viewportCanvas.getContext("webgl") || viewportCanvas.getContext("experimental-webgl");
		if (!gl) {
			throw new Error("Unable to initialize WebGL. Your browser may not support it.");
		}

		Settings.canvasWidth = $(viewportCanvas).width();
		Settings.canvasHeight = $(viewportCanvas).height();
		Settings.aspectRatio = Settings.canvasWidth / Settings.canvasHeight;
		viewportCanvas.width = Settings.canvasWidth;
		viewportCanvas.height = Settings.canvasHeight;

		// Initialize shader program
		Shaders.main.fragment.type = gl.FRAGMENT_SHADER;
		Shaders.main.vertex.type   = gl.VERTEX_SHADER;
		glShader.main.program      = gl.createProgram(); // Initialize GL Program

		Shaders.skybox.fragment.type = gl.FRAGMENT_SHADER;
		Shaders.skybox.vertex.type   = gl.VERTEX_SHADER;
		glShader.skybox.program      = gl.createProgram();


		var float_texture_ext = gl.getExtension('OES_standard_derivatives');


		// Compile, Attach and Link shaders to GL Programs
		_.each(Shaders, function(shaderProgram, shaderName){
			_.each(shaderProgram, function(shader, name){
				var shaderSrc = document.getElementById(shader.id).text,
					shaderObject = null;

				// Compile shader
				if (!shaderSrc) throw new Error("Could not find shader source for shader: " + name);
				shaderObject = gl.createShader(shader.type);
				gl.shaderSource(shaderObject, shaderSrc);
				gl.compileShader(shaderObject);

				// Did it compile successfully?
				if (!gl.getShaderParameter(shaderObject, gl.COMPILE_STATUS)) {
					throw new Error("An error occurred compiling the shader: " + gl.getShaderInfoLog(shaderObject));
				}

				gl.attachShader(glShader[shaderName].program, shaderObject);

			});

			gl.linkProgram(glShader[shaderName].program);
			if (!gl.getProgramParameter(glShader[shaderName].program, gl.LINK_STATUS)) {
				throw new Error("Unable to initialize shader program");
			}

			gl.useProgram(glShader[shaderName].program);



			// Enable each vertex attribute
			_.each(shaderProgram.vertex.attributes, function(attribute, name){
				vertexAttribute = gl.getAttribLocation(glShader[shaderName].program, name);
				// gl.enableVertexAttribArray(vertexAttribute);
				shaderProgram.vertex.attributes[name] = vertexAttribute;
			});

		});



		// Prepare the viewportCanvas
		gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
		gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
		gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things
		gl.viewport(0, 0, viewportCanvas.width, viewportCanvas.height);


		// Setup Camera
		createCamera(new THREE.Vector3(0.0, -150.0, 0.0));
		updateCamera();

		gl.useProgram(glShader.main.program);
		initTextures();

		bufferSkybox();
	},

	updateCamera = function(){

		Objects.camera.updateMatrixWorld()

		var perspectiveMatrix = Objects.camera.projectionMatrix,
			moveMatrix        = Objects.camera.matrixWorld,
			matrix            = Objects.camera.matrix;

		var pMatrix = [],
			mvMatrix = [];

		pMatrix = perspectiveMatrix.elements;
		mvMatrix = moveMatrix.elements;

		var qX = new THREE.Quaternion(),
			qY = new THREE.Quaternion(),
			qZ = new THREE.Quaternion(),
			m = new THREE.Matrix4();
		qX.setFromAxisAngle( new THREE.Vector3(0,1,0), Objects.camera.phi );
		qY.setFromAxisAngle( new THREE.Vector3(-1,0,0), -Objects.camera.theta );
		qZ.setFromAxisAngle( new THREE.Vector3(0,0,1), Objects.camera.lambda );
		qY.multiply(qX);
		qY.multiply(qZ);
		m.makeRotationFromQuaternion(qY);

		/*
		var euler = new THREE.Euler( Objects.camera.theta, Objects.camera.phi, 0 );
//  =   | cos H*cos B+sin H*sin P*sin B  cos B*sin H*sin P-sin B*cos H  cos P*sin H |
//		|                   cos P*sin B                    cos B*cos P       -sin P |
//		| sin B*cos H*sin P-sin H*cos B  sin H*sin B+cos B*cos H*sin P  cos P*cos H |
		var H = Objects.camera.phi,
			P = Objects.camera.theta,
			B = 0.0;

		var m = new THREE.Matrix4(
			Math.cos(H)*Math.cos(B) + Math.sin(H)*Math.sin(P)*Math.sin(B),
			Math.cos(B)*Math.sin(H)*Math.sin(P) - Math.sin(B)*Math.cos(H),
			Math.cos(P)*Math.sin(H),
			0,

			Math.cos(P)*Math.sin(B),
			Math.cos(B)*Math.cos(P),
			-Math.sin(P),
			0,

			Math.sin(B)*Math.cos(H)*Math.sin(P) - Math.sin(H)*Math.cos(B),
			Math.sin(H)*Math.sin(B) + Math.cos(B)*Math.cos(H)*Math.sin(P),
			Math.cos(P)*Math.cos(H),
			0,

			0,
			0,
			0,
			1
		);
	   */


		_.each(glShader, function(shader, shaderName){
			gl.useProgram(glShader[shaderName].program);

			var pUniform = gl.getUniformLocation(shader.program, "uPMatrix");
			gl.uniformMatrix4fv(pUniform, false, new Float32Array( pMatrix ));

			var vUniform = gl.getUniformLocation(shader.program, "uVMatrix");
			gl.uniformMatrix4fv(vUniform, false, m.elements);

			var mvUniform = gl.getUniformLocation(shader.program, "uMVMatrix");
			gl.uniformMatrix4fv(mvUniform, false, new Float32Array( mvMatrix ));
		});


	},

	createCamera = function(position, focalPoint){
		Objects.camera = new THREE.PerspectiveCamera( Settings.fov, Settings.aspectRatio, Settings.nearPlane, Settings.farPlane );
		camera = Objects.camera;
		camera.position = position;
		// camera.lookAt( new THREE.Vector3(0.0, 0.0, 1.0) );
		camera.phi = 0.0;
		camera.theta = 0.0;
		camera.lambda = 0;//Math.PI;
	},

	initTextures = function() {

		_.each(Textures, function(textures, shaderName){

			gl.useProgram(glShader[shaderName].program);

			_.each(textures, function(tex, i){
				if (tex.options && tex.options.skip) return;

				if (tex.cubemap) {

					tex.sampler = gl.createTexture();
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex.sampler);
					var loading=tex.cubemap.length;
					_.each(tex.cubemap, function(itex, i){

						var img = new Image();
						itex.image = img;
						img.onload = function(){
							gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex.sampler);
							gl.texImage2D(itex.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
							gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
							gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
							if (--loading==0) {
								gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
								tex.ready = true;
							}
						}
						img.src = itex.src;

					});
					gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

				} else {

					var img = new Image(),
						sampler = gl.createTexture();
					tex.sampler = sampler;
					tex.image   = img;

					img.onload = function() { handleTextureLoaded(tex.image, tex.sampler, tex.options); }
					img.src = tex.src;
				}
			});
	
		});

	},

	handleTextureLoaded = function(image, texture, options) {

		if (!options) {
			options = {
				parameter: gl.TEXTURE_2D,
				target: gl.TEXTURE_2D,
				repeat: true
			}
		} 

		var target = options.parameter,
			bindTarget = options.target;

		gl.bindTexture(target, texture);
		gl.texImage2D(bindTarget, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		// gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(target);

		// gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.

		if (options.repeat) {
			gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.REPEAT);
		} else {
			gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
			gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
		}
		gl.bindTexture(target, null);
	},

	bufferSkybox = function(){

		Objects.skybox = {
			vertices: [],
			elements: [],
			texcoords: [],

			verticesBuffer: null,
			texcoordBuffer: null,
			vao: null
		};


		// Default obj (cube)
		var size = Math.floor(Settings.farPlane / 2);
		Objects.skybox.vertices = [

			// Front
			-size , -size ,  size  ,
			 size , -size ,  size  ,
			 size ,  size ,  size  ,
			-size ,  size ,  size  ,

			// Back
			-size , -size , -size ,
			 size , -size , -size ,
			 size ,  size , -size ,
			-size ,  size , -size ,

		];

		Objects.skybox.elements = [

			0, 1, 2,      0, 2, 3, // Front
			1, 5, 6,      1, 6, 2, // Right
			0, 3, 4,      4, 3, 7, // Left
			3, 6, 2,      3, 7, 6, // Top
			4, 5, 1,      4, 1, 0, // Bottom
			4, 7, 6,      4, 6, 5, // Back

		];

		Objects.skybox.texcoords = [

			// Front
			-1.0, -1.0, 1.0, 
			1.0, -1.0, 1.0,
			1.0, 1.0, 1.0,
			-1.0, 1.0, 1.0,

			// Back
			-1.0, -1.0, -1.0,
			1.0, -1.0, -1.0,
			1.0, 1.0, -1.0,
			-1.0, 1.0, -1.0,

		];


		gl.useProgram(glShader.skybox.program);
		Objects.skybox.vao = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Objects.skybox.vao);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Objects.skybox.elements), gl.STATIC_DRAW);

		Objects.skybox.verticesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, Objects.skybox.verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Objects.skybox.vertices), gl.STATIC_DRAW);

		Objects.skybox.texcoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, Objects.skybox.texcoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Objects.skybox.texcoords), gl.STATIC_DRAW);

	},

	distanceFromQuad = function(x,y){
		var centerX  = (x + world.quadSize/2.0)/Settings.scaleXZ,
			centerY  = (y + world.quadSize/2.0)/Settings.scaleXZ,
			diffX    = (position.x) - centerX,
			diffY    = (position.y) - centerY,
			// diffX    = centerX + (-camera.position.x),
			// diffY    = centerY - camera.position.z,
			distance = diffX*diffX + diffY*diffY;
		return distance;
	},

	LOD_Spaces = {
		0: Math.pow(6561,2),
		1: Math.pow(2*6561,2),
		2: Math.pow(3*6561,2),
		3: Math.pow(4*6561,2),
		// 4: Math.pow(9000,2),
		// 5: Math.pow(12000,2),
	},

	lodLevelFromDistance = function(distance) {

		if (Settings.useLOD) {
			var lastLevel = null;
			for (var lodLevel in LOD_Spaces) {
				lastLevel = parseInt(lodLevel);
				if (distance < LOD_Spaces[lodLevel]) return parseInt(lodLevel);
			}

			return lastLevel;
		} else {
			return 0;
		}
	},

	drawScene = function(){

		// clear scene
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);      // Clear the color as well as the depth buffer.


		var drawQueue = { };
		var neighbourLODCompare = function(neighbour, lod){
			if (neighbour && drawQueue[neighbour.hash]) {
				if (drawQueue[neighbour.hash].lod < (lod-1)) {
					// neighbour LOD is too good
					return {newLOD: drawQueue[neighbour.hash].lod+1};
				} else if (drawQueue[neighbour.hash].lod > (lod+1)) {
					return {changeNeighbour: lod+1};
				}
			}
			return false;
		};
		var recheckNeighbours = function(quad, lod){
			for (var neighbour in quad.neighbours) {
				if (quad.neighbours[neighbour]) {
					var compare = neighbourLODCompare(quad.neighbours[neighbour], lod);
					if (compare) {
						if (compare.newLOD) {
							// have to change our lod to match this
							console.error("THIS SHOULD NEVER OCCUR");
						} else if (compare.changeNeighbour) {
							drawQueue[quad.neighbours[neighbour].hash].lod = compare.changeNeighbour;
							recheckNeighbours(quad.neighbours[neighbour], compare.changeNeighbour);
						}
					}
				}
			}
		};
		for (var quadHash in Objects.quads) {
			var quad     = Objects.quads[quadHash],
				distance = distanceFromQuad(quad.x, quad.y),
				lodLevel = lodLevelFromDistance(distance);
			// if (quadHash == 0) lodLevel = 2; // RED
			// else if (quadHash == -400) lodLevel = 2; // YELLOW
			// else if (quadHash == 109913200) lodLevel = 1; // BLUE

			var pendingNeighbourRecheck = false;
			for (var neighbour in quad.neighbours) {
				var neighbourCheck = neighbourLODCompare( quad.neighbours[neighbour], lodLevel );
				if (neighbourCheck) {
					if (neighbourCheck.newLOD) {
						lodLevel = neighbourCheck.newLOD;
						pendingNeighbourRecheck = true;
					} else if (neighbourCheck.changeNeighbour) {
						pendingNeighbourRecheck = true;
					}
				}
			}

			if (pendingNeighbourRecheck) {
				recheckNeighbours(quad, lodLevel);
			}
			

			// if (lodLevel > 2) lodLevel = 2; // Issues with LOD 3 :(
			drawQueue[quadHash] = { quad: quad, lod: lodLevel };
		}

		/* LOD CHECK TEST
		 *
		 * 	East -> West   : GOOD
		 * 	West -> East   : GOOD
		 * 	North -> South : GOOD
		 * 	South -> North : GOOD
		 *
		 * 		L1-L0: 
		 * 		L2-L1: 
		 **/

		var colors = [
			[1.0, 0.0, 0.0],
			[0.0, 1.0, 0.0],
			[0.0, 0.0, 1.0],
			[1.0, 1.0, 0.0],
			[0.0, 1.0, 1.0],
			[1.0, 0.0, 1.0],
			[0.0, 0.0, 0.0]
		];

		// Draw Skybox
		if (Textures.skybox[0].ready) {
			gl.useProgram(glShader.skybox.program);
			// var colorUniform = gl.getUniformLocation(glShader.main.program, "uColor");
			// gl.uniform3fv(colorUniform, new Float32Array( colors[i%4] ));

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, Textures.skybox[0].sampler);
			gl.uniform1i(gl.getUniformLocation(glShader.skybox.program, "TexSampler"), 0);

			_.each(Shaders.skybox.vertex.attributes, function(attribute, name){
				var vertexAttribute = attribute;
				gl.enableVertexAttribArray(vertexAttribute);
			});

			gl.bindBuffer(gl.ARRAY_BUFFER, Objects.skybox.verticesBuffer);
			gl.vertexAttribPointer(Shaders.skybox.vertex.attributes['aVertexCoord'], 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, Objects.skybox.texcoordBuffer);
			gl.vertexAttribPointer(Shaders.skybox.vertex.attributes['aTexCoord'], 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Objects.skybox.vao);
			gl.drawElements(gl.TRIANGLES, Objects.skybox.elements.length, gl.UNSIGNED_SHORT, 0);

			_.each(Shaders.skybox.vertex.attributes, function(attribute, name){
				var vertexAttribute = attribute;
				gl.disableVertexAttribArray(vertexAttribute);
			});
		}


		gl.useProgram(glShader.main.program);
		for (var i=0; i<Textures.main.length; ++i) {
			gl.activeTexture(gl.TEXTURE0+i);
			gl.bindTexture(gl.TEXTURE_2D, Textures.main[i].sampler);
			gl.uniform1i(gl.getUniformLocation(glShader.main.program, "uSampler"+i.toString()), i);
		}

		_.each(Shaders.main.vertex.attributes, function(attribute, name){
			var vertexAttribute = attribute;
			gl.enableVertexAttribArray(vertexAttribute);
		});

		var i=0;
		var highestLOD = 0,
			lowestLOD = 9999;
		for (var quadHash in drawQueue) {

			var quad = drawQueue[quadHash];
			if (!quad.quad.neighbours) continue; // Hasn't been deleted yet

			var colorUniform = gl.getUniformLocation(glShader.main.program, "uColor");
			gl.uniform3fv(colorUniform, new Float32Array( colors[quad.lod] ));
			i++;



			// Do we have this LOD loaded?
			if (quad.lod < quad.quad.loadedLOD.min) {
				if (!quad.quad.updating) {
					quad.quad.updating = true;
					loadQuadQueue.push({
						quad: quad.quad,
						range: { min: Math.max(quad.lod - 1, 0),
								 max: quad.quad.loadedLOD.min - 1 }
					});
					setTimeout(checkWorkerQueue, 100);
				}

				quad.lod = quad.quad.loadedLOD.min;
			} else if (quad.lod > quad.quad.loadedLOD.max) {
				if (!quad.quad.updating) {
					quad.quad.updating = true;
					loadQuadQueue.push({
						quad: quad.quad,
						range: { min: quad.quad.loadedLOD.max + 1,
								 max: quad.lod + 1 }
					});
					setTimeout(checkWorkerQueue, 100);
				}

				quad.lod = quad.quad.loadedLOD.max;
			}


			gl.bindBuffer(gl.ARRAY_BUFFER, quad.quad.slopesBuffer);
			gl.vertexAttribPointer(Shaders.main.vertex.attributes['aVertexSlope'], 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, quad.quad.verticesBuffer);
			gl.vertexAttribPointer(Shaders.main.vertex.attributes['aVertexPosition'], 3, gl.FLOAT, false, 0, 0);

			if (quad.lod > highestLOD) highestLOD = quad.lod;
			if (quad.lod < lowestLOD) lowestLOD = quad.lod;

			if (quad.quad.neighbours.north &&
				drawQueue[quad.quad.neighbours.north.hash] &&
				(drawQueue[quad.quad.neighbours.north.hash].lod < (quad.lod-1))){// ||
				 // (drawQueue[quad.quad.neighbours.north.hash].lod > (quad.lod+1))) {
				// console.error("Bad neighbour LOD");

				if (!quad.quad.updating) {
					quad.quad.updating = true;
					loadQuadQueue.push({
						quad: quad.quad,
						range: { min: Math.min(0,drawQueue[quad.quad.neighbours.north.hash].lod - 1),
								 max: quad.quad.loadedLOD.min - 1 }
					});
					setTimeout(checkWorkerQueue, 100);
				}
			}
			if (quad.quad.neighbours.south &&
				drawQueue[quad.quad.neighbours.south.hash] &&
				(drawQueue[quad.quad.neighbours.south.hash].lod < (quad.lod-1))){// ||
				 // drawQueue[quad.quad.neighbours.south.hash].lod > (quad.lod+1))) {
				// console.error("Bad neighbour LOD");

				if (!quad.quad.updating) {
					quad.quad.updating = true;
					loadQuadQueue.push({
						quad: quad.quad,
						range: { min: Math.min(0,drawQueue[quad.quad.neighbours.south.hash].lod - 1),
								 max: quad.quad.loadedLOD.min - 1 }
					});
					setTimeout(checkWorkerQueue, 100);
				}
			}
			if (quad.quad.neighbours.west &&
				drawQueue[quad.quad.neighbours.west.hash] &&
				(drawQueue[quad.quad.neighbours.west.hash].lod < (quad.lod-1))){// ||
				 // drawQueue[quad.quad.neighbours.west.hash].lod > (quad.lod+1))) {
				// console.error("Bad neighbour LOD");

				if (!quad.quad.updating) {
					quad.quad.updating = true;
					loadQuadQueue.push({
						quad: quad.quad,
						range: { min: Math.min(0,drawQueue[quad.quad.neighbours.west.hash].lod - 1),
								 max: quad.quad.loadedLOD.min - 1 }
					});
					setTimeout(checkWorkerQueue, 100);
				}
			}
			if (quad.quad.neighbours.east &&
				drawQueue[quad.quad.neighbours.east.hash] &&
				(drawQueue[quad.quad.neighbours.east.hash].lod < (quad.lod-1))){// ||
				 // drawQueue[quad.quad.neighbours.east.hash].lod > (quad.lod+1))) {
				// console.error("Bad neighbour LOD");

				if (!quad.quad.updating) {
					quad.quad.updating = true;
					loadQuadQueue.push({
						quad: quad.quad,
						range: { min: Math.min(0,drawQueue[quad.quad.neighbours.east.hash].lod - 1),
								 max: quad.quad.loadedLOD.min - 1 }
					});
					setTimeout(checkWorkerQueue, 100);
				}
			}



			var buffer = null;

			// inner
			if (quad.quad.elements[quad.lod] === undefined) {
				console.error("Bad LOD picked");
			}
			buffer = quad.quad.elements[quad.lod].elements.inner;
			if (!buffer.vao) continue; // VAO not bound yet
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.vao);
			gl.drawElements(gl.TRIANGLES, buffer.length, gl.UNSIGNED_SHORT, 0);

			var edgeDrawQueue = {
				top: quad.quad.elements[quad.lod].elements.top,
				bottom: quad.quad.elements[quad.lod].elements.bottom,
				left: quad.quad.elements[quad.lod].elements.left,
				right: quad.quad.elements[quad.lod].elements.right,
			};
			if (quad.quad.neighbours.north &&
				drawQueue[quad.quad.neighbours.north.hash] &&
				drawQueue[quad.quad.neighbours.north.hash].lod < quad.lod) {

				edgeDrawQueue['top'] = quad.quad.elements[quad.lod].elements.top_L0;
			}

			if (quad.quad.neighbours.south &&
				drawQueue[quad.quad.neighbours.south.hash] &&
				drawQueue[quad.quad.neighbours.south.hash].lod < quad.lod) {

				edgeDrawQueue['bottom'] = quad.quad.elements[quad.lod].elements.bottom_L0;
			}
			if (quad.quad.neighbours.west &&
				drawQueue[quad.quad.neighbours.west.hash] &&
				drawQueue[quad.quad.neighbours.west.hash].lod < quad.lod) {

				edgeDrawQueue['right'] = quad.quad.elements[quad.lod].elements.right_L0;
			}
			if (quad.quad.neighbours.east &&
				drawQueue[quad.quad.neighbours.east.hash] &&
				drawQueue[quad.quad.neighbours.east.hash].lod < quad.lod) {

				edgeDrawQueue['left'] = quad.quad.elements[quad.lod].elements.left_L0;
			}

			for (var edge in edgeDrawQueue) {
				buffer = edgeDrawQueue[edge];
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.vao);
				gl.drawElements(gl.TRIANGLES, buffer.length, gl.UNSIGNED_SHORT, 0);
			}

		}

		_.each(Shaders.main.vertex.attributes, function(attribute, name){
			var vertexAttribute = attribute;
			gl.disableVertexAttribArray(vertexAttribute);
		});

		/*
		if (lowestLOD != 0) {
			console.log("Lowest LOD rendered: "+lowestLOD);
		}

		if (highestLOD < 2) {
			console.log("Highest LOD rendered: "+highestLOD);
		}
		*/


		/*
		// Draw terrain quads
		for (var quadHash in Objects.quads) {
			var quad = Objects.quads[quadHash];

			// gl.bindBuffer(gl.ARRAY_BUFFER, quad.vao);
			// gl.vertexAttribPointer(Shaders.vertex.attributes['aVertexPosition'], 3, gl.FLOAT, false, 0, 0);
			// gl.drawArrays(gl.TRIANGLES, 0, quad.points.length/3);
			gl.bindBuffer(gl.ARRAY_BUFFER, quad.verticesBuffer);
			gl.vertexAttribPointer(Shaders.vertex.attributes['aVertexPosition'], 3, gl.FLOAT, false, 0, 0);
			// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad.vao);
			// gl.drawElements(gl.TRIANGLES, quad.elements.length, gl.UNSIGNED_SHORT, 0);

			var distance = distanceFromQuad(quad.x, quad.y);
			var lodLevel = lodLevelFromDistance(distance);
			for (var bufferName in quad.elements[lodLevel].elements) {
				// if (bufferName == "inner") continue;
				var buffer = quad.elements[lodLevel].elements[bufferName];
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.vao);
				gl.drawElements(gl.TRIANGLES, buffer.elements.length, gl.UNSIGNED_SHORT, 0);
			}

		}
		*/


		setTimeout(drawScene, Settings.framerate);

		if (generatedQuadQueue.length) {

				var obj = generatedQuadQueue.shift();

				var myWorker = obj.myWorker,
					quad     = obj.quad;
				// console.log("Quad generated: "+quad.heightmap.data.length);
				delete myWorker;
				world.workers_working--;
				// setTimeout(updateCanvas, 500);

				var time = (new Date()).getTime();
				bufferQuad(quad);
				var endTime = (new Date()).getTime();
				// console.log("Time buffering Quad: "+(endTime-time));
				--workersWorking;
				clearedThisQuad = true;
				quad.updating = false;
				// setTimeout(checkWorkerQueue, 100);
		}

	},

	begin = function(){
		createTerrain();
		bufferTerrain();
		drawScene();
	},

	createTerrain = function(){

		// for (var hash in world.quadCache) {
		// 	var quad = world.quadCache[hash];
		// 	// if (!(
		// 	// 		(quad.x == -100 && quad.y == -100)
		// 	// 	)) continue;
		// 	bufferQuad(quad);
		// }

	},

	bufferQuad = function(quad){

		// console.log("Buffering quad..");



		Objects.quads[quad.hash] = quad;
		quad.vao = null;
		// Objects.quads[quad.hash] = { x:quad.x, y:quad.y, points:quad.points, elements:[] };
		for (var lodLevel=quad.loadedLOD.min; lodLevel<=quad.loadedLOD.max; ++lodLevel) {
			var lSpace = quad.elements[lodLevel];
			/*
			Objects.quads[quad.hash].elements.push({
				lodSections: lSpace.lodSections,
				elements: {
					inner  : {vao: null, elements: lSpace.elements.inner},
					top    : {vao: null, elements: lSpace.elements.top},
					bottom : {vao: null, elements: lSpace.elements.bottom},
					right  : {vao: null, elements: lSpace.elements.right},
					left   : {vao: null, elements: lSpace.elements.left}
				}
			});
			*/
			// var last = Objects.quads[quad.hash].elements[ Objects.quads[quad.hash].elements.length - 1 ];
			for (var bufferName in lSpace.elements) {
			// for (var bufferName in last.elements) {
				var buffer = lSpace.elements[bufferName];
				if (buffer.vao) gl.deleteBuffer( buffer.vao );

				buffer.vao = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.vao);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(buffer), gl.STATIC_DRAW);
			}
		}
		if (Objects.quads[quad.hash].verticesBuffer) gl.deleteBuffer( Objects.quads[quad.hash].verticesBuffer );
		Objects.quads[quad.hash].verticesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, Objects.quads[quad.hash].verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.points), gl.STATIC_DRAW);

		if (Objects.quads[quad.hash].slopesBuffer) gl.deleteBuffer( Objects.quads[quad.hash].slopesBuffer );
		Objects.quads[quad.hash].slopesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, Objects.quads[quad.hash].slopesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.slopes), gl.STATIC_DRAW);

		/*
		Objects.quads[quad.hash] = { points:quad.points, elements:quad.elements, vao: null };
		Objects.quads[quad.hash].vao = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Objects.quads[quad.hash].vao);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quad.elements), gl.STATIC_DRAW);
		Objects.quads[quad.hash].verticesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, Objects.quads[quad.hash].verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.points), gl.STATIC_DRAW);
		// Objects.quads[quad.hash].vao = gl.createBuffer();
		// gl.bindBuffer(gl.ARRAY_BUFFER, Objects.quads[quad.hash].vao);
		// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.points), gl.STATIC_DRAW);
		*/

	},

	clearQuad = function(quad){

		// console.log("Clearing quad..");

		gl.deleteBuffer( Objects.quads[quad.hash].vao );
		delete Objects.quads[quad.hash];

	},

	bufferTerrain = function(){


	};

