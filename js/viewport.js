
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
	},  Buffer = {
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
					{name: "snow"     , src: "snow.jpg"              , sampler: null}   ,
					{name: "ice"      , src: "magnifiedfrost.jpg"    , sampler: null}   ,
					{name: "snowmud"  , src: "snowymud.jpg"          , sampler: null}   ,
					{name: "volcano"  , src: "slumberingvolcano.jpg" , sampler: null}   ,
					{name: "canyon"   , src: "ageofcanyon.jpg"       , sampler: null}   ,
					{name: "fault"    , src: "faultzone.jpg"         , sampler: null}   ,
					{name: "deepcave" , src: "deepcave.jpg"          , sampler: null}   ,
					{name: "bison"    , src: "justaddbison.jpg"      , sampler: null}   ,
					{name: "rocky"    , src: "rocky.jpg"             , sampler: null}   ,
					{name: "grass"    , src: "grass.jpg"             , sampler: null}   ,
					{name: "gravel"   , src: "gravel.jpg"            , sampler: null} ] ,
			skybox: [
						{ sampler: null, options: { skip: false }, cubemap: [
							{ src: "SunSet/SunSetUp2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
							{ src: "SunSet/SunSetDown2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
							{ src: "SunSet/SunSetLeft2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
							{ src: "SunSet/SunSetRight2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
							{ src: "SunSet/SunSetFront2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
							{ src: "SunSet/SunSetBack2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
						] },


						{ sampler: null, options: { skip: true }, cubemap: [
							{ src: "FullMoon/FullMoonUp2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
							{ src: "FullMoon/FullMoonDown2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
							{ src: "FullMoon/FullMoonLeft2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
							{ src: "FullMoon/FullMoonRight2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
							{ src: "FullMoon/FullMoonFront2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
							{ src: "FullMoon/FullMoonBack2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
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


		_.each(glShader, function(shader, shaderName){
			gl.useProgram(glShader[shaderName].program);

			var pUniform = gl.getUniformLocation(shader.program, "uPMatrix");
			gl.uniformMatrix4fv(pUniform, false, new Float32Array( pMatrix ));

			var vUniform = gl.getUniformLocation(shader.program, "uVMatrix");
			gl.uniformMatrix4fv(vUniform, false, m.elements);

			var mvUniform = gl.getUniformLocation(shader.program, "uMVMatrix");
			gl.uniformMatrix4fv(mvUniform, false, new Float32Array( mvMatrix ));

			var viewUniform = gl.getUniformLocation(shader.program, "viewDirection");
			if (viewUniform) {
				var view = new THREE.Vector3(0,0,1);

				var qX = new THREE.Quaternion(),
					qY = new THREE.Quaternion(),
					qZ = new THREE.Quaternion(),
					mV = new THREE.Matrix4();
				qX.setFromAxisAngle( new THREE.Vector3(0,1,0), -Objects.camera.phi );
				qY.setFromAxisAngle( new THREE.Vector3(-1,0,0),Objects.camera.theta );
				qZ.setFromAxisAngle( new THREE.Vector3(0,0,1), Objects.camera.lambda );
				qY.multiply(qX);
				qY.multiply(qZ);
				mV.makeRotationFromQuaternion(qY);
				mV.getInverse(mV);
				view.applyMatrix4(mV);

				view.x *= -1;

				gl.uniform3f(viewUniform, false, view.x, view.y, view.z);
			}
		});


	},

	createCamera = function(position, focalPoint){
		Objects.camera  = new THREE.PerspectiveCamera( Settings.fov, Settings.aspectRatio, Settings.nearPlane, Settings.farPlane );
		camera          = Objects.camera;
		camera.position = position;
		camera.phi      = 0.0;
		camera.theta    = 0.0;
		camera.lambda   = 0.0;
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
							gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
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
		gl.generateMipmap(target);


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
			distance = diffX*diffX + diffY*diffY;
		return distance;
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



		// Figure out which LOD to draw for each quad
		var drawQueue = { },

			neighbourLODCompare = function(neighbour, lod){
				if (neighbour && drawQueue[neighbour.hash]) {
					if (drawQueue[neighbour.hash].lod < (lod-1)) {
						// neighbour LOD is too good
						return {newLOD: drawQueue[neighbour.hash].lod+1};
					} else if (drawQueue[neighbour.hash].lod > (lod+1)) {
						return {changeNeighbour: lod+1};
					}
				}
				return false;
			},

			recheckNeighbours = function(quad, lod){
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
			

			drawQueue[quadHash] = { quad: quad, lod: lodLevel };
		}


		// Colours used for displaying LOD map on quads
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


		// Prepare textures
		gl.useProgram(glShader.main.program);
		for (var i=0; i<Textures.main.length; ++i) {
			gl.activeTexture(gl.TEXTURE0+i);
			gl.bindTexture(gl.TEXTURE_2D, Textures.main[i].sampler);
			gl.uniform1i(gl.getUniformLocation(glShader.main.program, Textures.main[i].name), i);
		}

		_.each(Shaders.main.vertex.attributes, function(attribute, name){
			var vertexAttribute = attribute;
			gl.enableVertexAttribArray(vertexAttribute);
		});

		var i=0;
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
			gl.vertexAttribPointer(Shaders.main.vertex.attributes['aVertexSlope'], 4, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, quad.quad.verticesBuffer);
			gl.vertexAttribPointer(Shaders.main.vertex.attributes['aVertexPosition'], 3, gl.FLOAT, false, 0, 0);

			// If our neighbour is being drawn with a lower LOD than we can handle, then queue this quad
			// loading that LOD
			if (quad.quad.neighbours.north &&
				drawQueue[quad.quad.neighbours.north.hash] &&
				(drawQueue[quad.quad.neighbours.north.hash].lod < (quad.lod-1))){

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
				(drawQueue[quad.quad.neighbours.south.hash].lod < (quad.lod-1))){

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
				(drawQueue[quad.quad.neighbours.west.hash].lod < (quad.lod-1))){

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
				(drawQueue[quad.quad.neighbours.east.hash].lod < (quad.lod-1))){

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

			// Draw Inner part of quad
			if (quad.quad.elements[quad.lod] === undefined) {
				console.error("Bad LOD picked");
			}
			buffer = quad.quad.elements[quad.lod].elements.inner;
			if (!buffer.vao) continue; // VAO not bound yet (probably waiting to be buffered)
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.vao);
			gl.drawElements(gl.TRIANGLES, buffer.length, gl.UNSIGNED_SHORT, 0);


			// Draw queue for edges
			// NOTE: if a neighbour quad is being rendered at a lower LOD than ours, then
			// 		we need to render our adjacent edges at a matching LOD (skirts)
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



		setTimeout(drawScene, Settings.framerate);


		// Buffer new-loaded quads
		while (generatedQuadQueue.length) {

				var obj = generatedQuadQueue.shift();

				var myWorker = obj.myWorker,
					quad     = obj.quad;
				delete myWorker;

				var time = (new Date()).getTime();
				bufferQuad(quad);
				console.log("["+quad.index+"] BUFFERED QUAD");

				delete quad.points;
				delete quad.slopes;
				for (var i=0; i<quad.elements.length; ++i) {
					if (quad.elements[i]) {
						var elements = quad.elements[i].elements;
						if (elements) {
							for (var el in elements) {
								delete elements[el].data;
							}
						}
					}
				}

				var endTime = (new Date()).getTime();
				--workersWorking;
				if (workersWorking < 0) {
					workersWorking = 0;
				}
				quad.updating = false;

		}

	},

	bufferQuad = function(quad){

		Objects.quads[quad.hash] = quad;
		for (var lodLevel=quad.loadedLOD.min; lodLevel<=quad.loadedLOD.max; ++lodLevel) {
			var lSpace = quad.elements[lodLevel];
			for (var bufferName in lSpace.elements) {
				var buffer = lSpace.elements[bufferName];
				if (buffer.vao) gl.deleteBuffer( buffer.vao ); // NOTE: need to rebuffer existing elements since they will point to an older verticesBuffer

				buffer.vao = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.vao);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(buffer.data), gl.STATIC_DRAW);
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

	},

	clearQuad = function(quad){

		gl.deleteBuffer( Objects.quads[quad.hash].vao );
		delete Objects.quads[quad.hash];

	};

