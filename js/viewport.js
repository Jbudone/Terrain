
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
			},
			water: {
				program: null,
				vertexShader: null,
				fragmentShader: null
			}
	},  Buffer = {
			skybox:null,
			water:null
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
			},
			water: {
				'fragment':{
					'type':null,
					'id':'water-fs'
				},
				'vertex':{
					'type':null,
					'id':'water-vs',
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
			water: [
					{name: "TexSampler", src: "water512.jpg", sampler: null},
					{name: "BumpSampler", src: "water_normalmap.jpg", sampler: null},
					{name: "DuDvSampler", src: "water_dudv.jpg", sampler: null} ],
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
							{ src: "FullMoon/FullMoonUp2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
							{ src: "FullMoon/FullMoonDown2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
							{ src: "FullMoon/FullMoonLeft2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
							{ src: "FullMoon/FullMoonRight2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
							{ src: "FullMoon/FullMoonFront2048.png", target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
							{ src: "FullMoon/FullMoonBack2048.png", target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
						] },


			
					]
	};


	var rttFramebuffer = null,
		rttTexture = null,
		renderbuffer = null;

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

		Shaders.water.fragment.type = gl.FRAGMENT_SHADER;
		Shaders.water.vertex.type   = gl.VERTEX_SHADER;
		glShader.water.program      = gl.createProgram();


		var float_texture_ext = gl.getExtension('OES_standard_derivatives'),
			uint_index_ext    = gl.getExtension('OES_element_index_uint');   // Allow uint based elements (bigger terrain quads)


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
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
		gl.viewport(0, 0, viewportCanvas.width, viewportCanvas.height);


		// Setup Camera
		createCamera(new THREE.Vector3(0.0, -150.0, 0.0));
		updateCamera();

		gl.useProgram(glShader.main.program);
		initTextures();

		bufferWater();
		bufferSkybox();




		//=============================================================
		// FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME 
		//
		// Rendering to texture for water
		rttFramebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
		rttFramebuffer.width = 512;
		rttFramebuffer.height = 512;

		rttTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, rttTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME 
		//=============================================================



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

			var mvYUniform = gl.getUniformLocation(shader.program, "uMVYMatrix");
			if (mvYUniform) {

				var mvYMatrix = new THREE.Matrix4();
				mvYMatrix.copy(Objects.camera.matrixWorld);
				mvYMatrix.elements[12] = 0.0;
				mvYMatrix.elements[14] = 0.0;
				gl.uniformMatrix4fv(mvYUniform, false, new Float32Array( mvYMatrix.elements ));
			}

			var offsetUniform = gl.getUniformLocation(shader.program, "uOffset");
			if (offsetUniform) {
				// gl.uniform3f(offsetUniform, false, 0*Objects.camera.position.x, Objects.camera.position.z, 0*Objects.camera.position.z);
				gl.uniform3f(offsetUniform, Objects.camera.position.x, Objects.camera.position.z, Objects.camera.position.y);
			}

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
		camera.phi      = 2.5;
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

	bufferWater = function(){

		Objects.water = {
			vertices: [],
			elements: [],
			texcoords: [],

			verticesBuffer: null,
			texcoordBuffer: null,
			vao: null
		};

		var size = Settings.farPlane;
		Objects.water.vertices = [
			-size, -10.0, -size,
			size,  -10.0, -size,
			size,  -10.0, size,
			-size, -10.0, size
		];

		Objects.water.elements = [
			0, 1, 2,
			0, 2, 3
		];

		var repeats = 1000.0;
		Objects.water.texcoords = [
			0.0, 0.0,
			repeats, 0.0,
			repeats, repeats,
			0.0,  repeats
		];


		gl.useProgram(glShader.water.program);
		Objects.water.vao = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Objects.water.vao);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Objects.water.elements), gl.STATIC_DRAW);

		Objects.water.verticesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, Objects.water.verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Objects.water.vertices), gl.STATIC_DRAW);

		Objects.water.texcoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, Objects.water.texcoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Objects.water.texcoords), gl.STATIC_DRAW);

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
				if (distance < LOD_Spaces[lodLevel].distance) return parseInt(lodLevel);
			}

			return lastLevel;
		} else {
			return 0;
		}
	},

	drawScene = function(){

		// clear scene
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
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

			/*
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
			*/
			

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


			// Do we have this LOD loaded?
			if (quad.quad.lod != quad.lod) {
				if (!quad.quad.updating) {
					quad.quad.updating = true;
					quad.quad.updatingLOD = lod;
					loadQuadQueue.push({
						quad: quad.quad,
						lod: quad.lod
					});
					setTimeout(checkWorkerQueue, 100);
				} else if (quad.quad.worker && quad.quad.updatingLOD != lod) {
					// Currently working on an old LOD
					quad.quad.worker.terminate(); // Prefer the new LOD
					delete quad.quad.worker;
					quad.quad.resolve({myWorker: this, quad: null});
					quad.quad.updatingLOD = lod;
					loadQuadQueue.push({
						quad: quad.quad,
						lod: quad.lod
					});
					setTimeout(checkWorkerQueue, 100);
				}
				quad.lod = quad.quad.lod;
			}

			var colorUniform = gl.getUniformLocation(glShader.main.program, "uColor");
			gl.uniform3fv(colorUniform, new Float32Array( colors[quad.lod] ));
			i++;



			gl.bindBuffer(gl.ARRAY_BUFFER, quad.quad.slopesBuffer);
			gl.vertexAttribPointer(Shaders.main.vertex.attributes['aVertexSlope'], 4, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, quad.quad.verticesBuffer);
			gl.vertexAttribPointer(Shaders.main.vertex.attributes['aVertexPosition'], 3, gl.FLOAT, false, 0, 0);




			var buffer = null;

			// Draw Inner part of quad
			if (quad.quad.lod == undefined) continue; // Not yet set
			if (quad.quad.elements[quad.lod] === undefined) {
				console.error("Bad LOD picked");
			}
			buffer = quad.quad.elements[quad.lod].elements.inner;
			if (!buffer.vao) continue; // VAO not bound yet (probably waiting to be buffered)
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.vao);
			gl.drawElements(gl.TRIANGLES, buffer.length, gl.UNSIGNED_INT, 0);


		}

		//=============================================================
		// FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME 
		//
		// Rendering to texture for water
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

		var i=0;
		for (var quadHash in drawQueue) {

			var quad = drawQueue[quadHash];
			if (!quad.quad.neighbours) continue; // Hasn't been deleted yet


			// Do we have this LOD loaded?
			if (quad.quad.lod != quad.lod) {
				if (!quad.quad.updating) {
					quad.quad.updating = true;
					quad.quad.updatingLOD = lod;
					loadQuadQueue.push({
						quad: quad.quad,
						lod: quad.lod
					});
					setTimeout(checkWorkerQueue, 100);
				} else if (quad.quad.worker && quad.quad.updatingLOD != lod) {
					// Currently working on an old LOD
					quad.quad.worker.terminate(); // Prefer the new LOD
					delete quad.quad.worker;
					quad.quad.resolve({myWorker: this, quad: null});
					quad.quad.updatingLOD = lod;
					loadQuadQueue.push({
						quad: quad.quad,
						lod: quad.lod
					});
					setTimeout(checkWorkerQueue, 100);
				}
				quad.lod = quad.quad.lod;
			}

			var colorUniform = gl.getUniformLocation(glShader.main.program, "uColor");
			gl.uniform3fv(colorUniform, new Float32Array( colors[quad.lod] ));
			i++;



			gl.bindBuffer(gl.ARRAY_BUFFER, quad.quad.slopesBuffer);
			gl.vertexAttribPointer(Shaders.main.vertex.attributes['aVertexSlope'], 4, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, quad.quad.verticesBuffer);
			gl.vertexAttribPointer(Shaders.main.vertex.attributes['aVertexPosition'], 3, gl.FLOAT, false, 0, 0);




			var buffer = null;

			// Draw Inner part of quad
			if (quad.quad.lod == undefined) continue; // Not yet set
			if (quad.quad.elements[quad.lod] === undefined) {
				console.error("Bad LOD picked");
			}
			buffer = quad.quad.elements[quad.lod].elements.inner;
			if (!buffer.vao) continue; // VAO not bound yet (probably waiting to be buffered)
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.vao);
			gl.drawElements(gl.TRIANGLES, buffer.length, gl.UNSIGNED_INT, 0);


		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME 
		//=============================================================




		_.each(Shaders.main.vertex.attributes, function(attribute, name){
			var vertexAttribute = attribute;
			gl.disableVertexAttribArray(vertexAttribute);
		});


		// Draw Water
		if (Textures.water[0]) {
			gl.useProgram(glShader.water.program);

			// Prepare textures
			for (var i=0; i<Textures.water.length; ++i) {
				gl.activeTexture(gl.TEXTURE0+i);
				gl.bindTexture(gl.TEXTURE_2D, Textures.water[i].sampler);
				gl.uniform1i(gl.getUniformLocation(glShader.water.program, Textures.water[i].name), i);
			}

			//=====================================================================
			//  FIXME  FIXME  FIXME  FIXME  FIXME  FIXME  FIXME  FIXME  FIXME  FIXME FIXME 
			gl.activeTexture(gl.TEXTURE0+3);
			gl.bindTexture(gl.TEXTURE_2D, rttTexture);
			gl.uniform1i(gl.getUniformLocation(glShader.water.program, "rtt"), 3);
			//  FIXME  FIXME  FIXME  FIXME  FIXME  FIXME  FIXME  FIXME  FIXME  FIXME FIXME 
			//=====================================================================

			_.each(Shaders.water.vertex.attributes, function(attribute, name){
				var vertexAttribute = attribute;
				gl.enableVertexAttribArray(vertexAttribute);
			});

			gl.bindBuffer(gl.ARRAY_BUFFER, Objects.water.verticesBuffer);
			gl.vertexAttribPointer(Shaders.water.vertex.attributes['aVertexCoord'], 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, Objects.water.texcoordBuffer);
			gl.vertexAttribPointer(Shaders.water.vertex.attributes['aTexCoord'], 2, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Objects.water.vao);
			gl.drawElements(gl.TRIANGLES, Objects.water.elements.length, gl.UNSIGNED_SHORT, 0);

			_.each(Shaders.water.vertex.attributes, function(attribute, name){
				var vertexAttribute = attribute;
				gl.disableVertexAttribArray(vertexAttribute);
			});
		}


		setTimeout(drawScene, Settings.framerate);


		// Buffer new-loaded quads
		while (generatedQuadQueue.length) {

				var obj = generatedQuadQueue.shift();

				var myWorker = obj.myWorker,
					quad     = obj.quad;
				delete myWorker;

				if (quad.newlod === undefined) continue;
				var time = (new Date()).getTime();
				bufferQuad(quad);
				console.log("["+quad.index+"] BUFFERED QUAD");

				delete quad.points;
				delete quad.slopes;
				var lod = quad.lod;
				if (quad.elements[lod]) {
					var elements = quad.elements[lod].elements;
					if (elements) {
						for (var el in elements) {
							delete elements[el].data;
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
		if (quad.lod !== undefined && quad.lod !== quad.newlod && quad.elements[quad.lod].elements['inner'].vao) gl.deleteBuffer( quad.elements[quad.lod].elements['inner'].vao ); // NOTE: need to rebuffer existing elements since they will point to an older verticesBuffer
		quad.lod = quad.newlod; delete quad.newlod;
		var lSpace = quad.elements[quad.lod];
		var buffer = lSpace.elements['inner'];

		buffer.vao = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.vao);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(buffer.data), gl.STATIC_DRAW);
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

