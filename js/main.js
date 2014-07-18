
var canvas = null,
	gl     = null,
	Camera = { position: null },
	Shaders = {
		main: {
			program: null,
			vertex: {
				program: null,
				type:null,
				id:'shader-vs',
				attributes:{
					aVertexPosition:null
				}
			}, fragment: {
				program: null,
				type: null,
				id: 'shader-fs'
			}
		},
		skybox: {
			program: null,
			vertex: {
				program: null,
				type:null,
				id:'skybox-vs',
				attributes:{
					aVertexPosition:null
				}
			}, fragment: {
				program: null,
				type: null,
				id: 'skybox-fs'
			}
		}
	},
	Settings = {
		framerate: 45,
		fov: 45,
		nearPlane: 0.1,
		farPlane: 100.0,
		canvasWidth: null,
		canvasHeight: null,
		aspectRatio: null
	};


	var initWebGL = function(){

			canvas = document.getElementById('canvas');
			gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
			if (!gl) {
				throw new Error("Unable to initialize WebGL. Your browser may not support it.");
			}

			Settings.canvasWidth = $(canvas).width();
			Settings.canvasHeight = $(canvas).height();
			Settings.aspectRatio = Settings.canvasWidth / Settings.canvasHeight;

			// Initialize shader program
			Shaders.main.fragment.type = gl.FRAGMENT_SHADER;
			Shaders.main.vertex.type   = gl.VERTEX_SHADER;
			Shaders.main.program       = gl.createProgram(); // Initialize GL Program

			Shaders.skybox.fragment.type = gl.FRAGMENT_SHADER;
			Shaders.skybox.vertex.type   = gl.VERTEX_SHADER;
			Shaders.skybox.program       = gl.createProgram();


			// Compile, Attach and Link shaders to GL Programs
			_.each(Shaders, function(shaderProgram, shaderName){
				_.each(shaderProgram, function(shader, name){
					if (name === 'program') return;
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

					gl.attachShader(Shaders.program, shaderObject);

				});

				gl.linkProgram(shaderProgram.program);
				if (!gl.getProgramParameter(shaderProgram.program, gl.LINK_STATUS)) {
					throw new Error("Unable to initialize shader program");
				}

				gl.useProgram(shaderProgram.program);


				// Enable each vertex attribute
				_.each(shaderProgram.vertex.attributes, function(attribute, name){
					vertexAttribute = gl.getAttribLocation(shaderProgram.program, name);
					gl.enableVertexAttribArray(vertexAttribute);
					shaderProgram.vertex.attributes[name] = vertexAttribute;
				});

			});


			// Prepare the canvas
			gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
			gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
			gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things
			gl.viewport(0, 0, canvas.width, canvas.height);

	},

	updateCamera = function(){

		// TODO: Abstract this with camera, only set uniform upon moving camera
		var perspectiveMatrix = makePerspective(Settings.fov, Settings.aspectRatio, Settings.nearPlane, Settings.farPlane);

		var mvMatrix = Matrix.I(4),
		camPosition = Camera.position.elements;
		mvMatrix = makeLookAt(camPosition[0], camPosition[1], camPosition[2],
							  0.0, 0.0, 0.0,
							  0.0, 1.0, 0.0);

		_.each(Shaders, function(shader, shaderName){
			var pUniform = gl.getUniformLocation(shader.program, "uPMatrix");
			gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

			var mvUniform = gl.getUniformLocation(shader.program, "uMVMatrix");
			gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

			var widthUniform = gl.getUniformLocation(shader.program, "screenWidth");
			gl.uniform1f(widthUniform, false, Settings.canvasWidth);

			var heightUniform = gl.getUniformLocation(shader.program, "screenHeight");
			gl.uniform1f(heightUniform, false, Settings.canvasHeight);
		});
	},

	createCamera = function(position, focalPoint){
		Camera.position = position;
		Camera.direction = $V([ 0, 0, 1 ]);
	},


	draw = function(){

			// clear scene
			gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);      // Clear the color as well as the depth buffer.

			gl.bindBuffer(gl.ARRAY_BUFFER, bufferPoints);
			gl.vertexAttribPointer(Shaders.vertex.attributes['aVertexPosition'], 3, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			setTimeout(draw, 100);
			// requestAnimationFrame(draw);
	};
