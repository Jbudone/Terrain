
// TODO
//
//	> LOD: use skirts/ribbons/flanges (which?)
//		- convert to TRIANGLE_STRIP elements
//		- add skirts (preset vertical distance)
//			- fix sizes (elements & points/slopes)
//			- remove 'inner'; lodRange
//
//	> Greedy quad generation: value = (quality / cost)
//	> Water
//		- really big tessellated quad
//		- water shader
//		- quad follows you around
//		- water texture
//		- water transparency
//		- water bumpmap, specmap
//		- water lighting
//		- water shader noise for waves
//
//
//
//
//	> 3d noise in shaders: bumpy ground, dirty surfaces, vegetation, watery ground, turbulence + sine normal
//							map on high slopes (erosion), alpha map between main/slope textures, turbulence
//							along band-lines
//	> specular based off heightband, normal & slope (snow & ice, watery ground?)
//	> fix fog stuff
//
//
//
//
//		(next week nice-to-have)
//	> heightmap: random boulders
//	> various detail textures?
// 	> optimize GLSL stuff
// 	> more LOD's w/ dynamic LOD & clear older LOD
// 	> GLSL: get rid of annoying sparkly stuff from far away
// 	> over-bright snow-band; emphasis on lighting on steep mountain slopes
// 	> fix annoying LOD holes & flickering; shouldn't have to load full LOD range in 1 go
// 	> maximize viewRadius, quadSize & sections; determine based off of if LOD is used, memory consumption; try
// 			to see far enough to always see mountains in the distance; fix fog
// 		- stable (SLOW): 6200/70000 20/10000
// 		- stable (FAST): 6200/60000 4/800
// 	> git
// 	> https://github.com/ashima/webgl-noise/wiki  :: converted to JS, fixed, reference; ask to be on his site
//	> FIREFOX support
//	> CLEAN: LOD base 3
//	> CLEAN: transferring points/slopes/normals
//	> CLEAN: normal calculation && confirm accuracy and usage in GLSL 
//
//	> Report (guide for exploring/explaining the project)
// 	> Presentation: LOD; short vs. int elements & sizes/quality; Noise blending; Where to go from here;
// 	Webworkers/transferable objects/build queues/garbage collection sync; heightmap building process what
// 	different noise looks like)
//		- intro: what I did (infinite terrain generator) & what's involved (heightmap generation, polyganization + LOD, texture synthesis)
//		- heightmap generation: basis noise functions, demo break of noise tricks
//		- javascript: single threaded, offload quads to webworkers, transferable objects
//		- webgl: want to see far - short/int limitation; memory/garbage collection limitation
//		- LOD: idea to use LOD for future + skirts, demo LOD, LOD radius; sticking with LOD0 for now
//				(loading/performance problems)
//		- texture synthesis: height bands, slopes, linear interpolation, lighting, tinting, triplanar mapping,
//							blending same texture different scales, detail texture  (demo break)
//		- desirable texture synthesis: cool things I found & want
// 		
//
//
//
// 	> CLEAN and refactor everything
// 	> Documentation
// 	> better abstraction & architecture setup
// 	> abstract settings
// 	> zoom out of quadtree to show rebuilding process (Eagle Eye); extend far plane
// 	> show wireframe; switch between wireframe / solid
// 	> allow both webworkers & async mode (importscript for loading noises)
// 	> settings to enable/disable heightmap; LOD0 loads heightmap
// 	> draw camera point on map
// 	> elegant way to swap between skybox textures & heightmap generators + textures
// 	> better fog effects
// 	> safe fail (modernizr) check if browser supports these: webworkers, canvas, webgl, transferableobjects
// 	> NOTE: quadSize (speed: 8192, quality: 1024) -- cant fix without using INT elements, not supported yet
// 	> build script (console.log for debug mode)
//	> fix seed number for variation in terrain
//
//	> generate heightmap & world points & elements at the same time (same loop)
// 	> smoother movement
// 	> sync far plane with view radius and map canvas size and skybox size
// 	> find optimal transfer object & transfer method
// 	> better hashing algorithm (no need for really high numbers, just modulate)
// 	> find a way to show wireframe (drawlines?)
// 	> check performance & timeline
// 	> loadQuadQueue check that quad is still needed for updating (distance, in view? in requested LOD range?)
// 	> BUG: some noise returns outside of range values
// 	> BUG: voronoi noise with negative numbers
// 	> BUG: voronoi F2 noise
// 	> BUG: when moving really fast along the canvas, sometimes missing quads occur 
// 	> BUG: quads being unloaded twice
// 	> BUG: quad edges show up as west(right), east(left)
//
// 	> BUG: glsl flickering effect along band-lines -- NOTE:
// 			http://stackoverflow.com/questions/14765517/how-to-eliminate-texture-seams-from-mipmapping 
// 			problem is solved via. dFdX/dFdY and textureGrad; however textureGrad isn't out for webgl yet
// 			The best approach might be to wait until webgl 2.0 comes out (based off ES3) which hopefully
// 			provides textureGrad  (side note: the issue is due to mipmapping across non-uniform control flow)
//			https://www.opengl.org/wiki/Sampler_(GLSL)#Non-uniform_flow_control

var canvas             = document.getElementById('heightmap'),
	ctx                = canvas.getContext('2d'),
	heightmap          = ctx.getImageData(0, 0, canvas.width, canvas.height),
	position           = {x:0, y:0},
	world              = null,
	loadQuadQueue      = [],
	generatedQuadQueue = [],
	workersWorking     = 0,
	quadIndex          = 0,
	buggyWorkerTimeout = 2000,
	checkWorkerQueue = function(){
		if (loadQuadQueue.length && workersWorking < Settings.maxWorkers) {

			// Pick the closest quad to us
			var nearestLoadInfo = null,
				nearestDistance = 999999,
				nearestI = 0;
			for (var i=0; i<loadQuadQueue.length; ++i) {
				var quadI = loadQuadQueue[i].quad,
					distance = distanceFromQuad( quadI.x, quadI.y );
				if (nearestLoadInfo == null || distance < nearestDistance) {
					nearestLoadInfo = loadQuadQueue[i];
					nearestDistance = distance;
					nearestI = i;
				}
			}

			loadQuadQueue.splice( nearestI, 1 );

			var loadInfo = nearestLoadInfo,
				quad = loadInfo.quad,
				clearedThisQuad = false;
			++workersWorking;
			// loadInfo.range.min = 0;
			// if (Settings.useLOD) loadInfo.range.max = 6; // FIXME
			// else loadInfo.range.max = 0;
			console.log("["+quad.index+"] GENERATING QUAD");
			quad.generate(loadInfo.lod).then(function(obj){
				if (obj.quad) {
					generatedQuadQueue.push(obj);
					console.log("["+quad.index+"] GENERATED QUAD");
				} else if (quad) {
					console.error("didn't work..");
					quad.updating = false;
					--workersWorking;
				} else {
					console.error("didn't work...");
					--workersWorking;
				}
				clearedThisQuad = true;
			});

			//setTimeout(function(){ if (!clearedThisQuad){ quad.updating=false; console.error("Quad was not cleared.."); buggyWorkerTimeout = 8000; } }, buggyWorkerTimeout); // TODO: remove this bug
			checkWorkerQueue();
		}
	};

	setTimeout(checkWorkerQueue, 100);
	setInterval( checkWorkerQueue, 800 );

	var generateImage = function(){
		canvas.width  = 500;
		canvas.height = 500;
		world = new World();
		world.initialize();

		for (var hash in world.quadCache) {
			var quad = world.quadCache[hash],
				lod  = lodLevelFromDistance( distanceFromQuad(quad.x, quad.y) );
			loadQuadQueue.push({
				quad: quad,
				lod: lod,
				// range: { min: Math.max(lod - 1, 0),
				// 		 max: lod + 1 }
			});
		}
	},

	updateCanvas = function(){

		ctx.fillRect(0, 0, canvas.width, canvas.height);
		for (var hash in world.quadCache) {
			var quad = world.quadCache[hash];
			if (quad.heightmap) {
				ctx.putImageData( quad.heightmap, (-quad.x  + position.x) / (world.quadSize / Settings.quadTiles), (-quad.y   + position.y) / (world.quadSize / Settings.quadTiles), 0, 0, world.quadSize, world.quadSize );
				// ctx.putImageData( quad.heightmap, (-quad.x  + position.x) / (world.quadSize / Settings.quadTiles) - canvas.width/4, (-quad.y   + position.y) / (world.quadSize / Settings.quadTiles) - canvas.height/4, 0, 0, world.quadSize, world.quadSize );
			}
		}

		ctx.fillStyle="#FF0000";
		ctx.beginPath();
		ctx.arc(canvas.width/2 - 2, canvas.height/2 - 2, 4, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle="#000000";
	};


var FULL_INSIDE = 1,
	FULL_OUTSIDE = 2,
	PARTIAL_INSIDE = 3;


////////////////////////////////////////////////////
//
// 				WORLD
//
////////////////////////////////////////////////////

var World = function(){



	this.hashQuad = function(x, y){ return x + y*274783; }; // TODO: better hash 

	this.viewRadius = Settings.viewRadius;
	this.initialize = function(){

		console.log("INITIALIZING!!!  ...("+world.quadSize+")");
		var quadQueue = [
			{ x: Math.floor(-position.x/world.quadSize)*world.quadSize, y: Math.floor(-position.y/world.quadSize)*world.quadSize },
		];

		while (quadQueue.length) {
			var quadToAdd = quadQueue.shift(),
				hash = this.hashQuad( quadToAdd.x, quadToAdd.y );
			if (this.quadCache[hash]) continue;

			var quad = new Quad( quadToAdd.x, quadToAdd.y );
			if (quad.isInside(position, this.viewRadius) === FULL_OUTSIDE) continue;

			this.quadCache[quad.hash] = quad;
			var neighboursToAdd = [
				{ x: quad.x + this.quadSize, y: quad.y, neighbour: 'west',  neighbourOf: 'east' }, // West
				{ x: quad.x - this.quadSize, y: quad.y, neighbour: 'east',  neighbourOf: 'west' }, // East
				{ x: quad.x, y: quad.y + this.quadSize, neighbour: 'north', neighbourOf: 'south' }, // North
				{ x: quad.x, y: quad.y - this.quadSize, neighbour: 'south', neighbourOf: 'north' }, // South
			];

			for (var i=0; i<neighboursToAdd.length; ++i) {
				var neighbourToAdd = neighboursToAdd[i],
					nHash = this.hashQuad(neighbourToAdd.x, neighbourToAdd.y);
				if (this.quadCache[nHash]) {
					quad.neighbours[ neighbourToAdd.neighbour ] = this.quadCache[nHash];
					this.quadCache[nHash].neighbours[ neighbourToAdd.neighbourOf ] = quad;
				} else {
					quadQueue.push( neighbourToAdd );
				}
			}
		}
	};

	this.update = function(){

		var checkQuadsQueue = [],
			deleteQueue = {};
		for (var hash in this.quadCache) {

			var quad = this.quadCache[hash];
			if (quad.isInside(position, this.viewRadius) === FULL_OUTSIDE) {
				deleteQueue[hash] = quad;
			} else {
				var neighboursToCheck = [
					{ x: quad.x + this.quadSize, y: quad.y, neighbour: 'west',  neighbourOf: 'east' }, // West
					{ x: quad.x - this.quadSize, y: quad.y, neighbour: 'east',  neighbourOf: 'west' }, // East
					{ x: quad.x, y: quad.y + this.quadSize, neighbour: 'north', neighbourOf: 'south' }, // North
					{ x: quad.x, y: quad.y - this.quadSize, neighbour: 'south', neighbourOf: 'north' }, // South
				];

				for (var i=0; i<neighboursToCheck.length; ++i) {
					var neighbourToCheck = neighboursToCheck[i],
						nHash = this.hashQuad(neighbourToCheck.x, neighbourToCheck.y);

					if (this.quadCache[nHash]) continue;
					checkQuadsQueue.push( neighbourToCheck );
				}
			}
		}

		// TODO: abstract this
		while (checkQuadsQueue.length) {
			var quadToAdd = checkQuadsQueue.shift(),
				hash = this.hashQuad( quadToAdd.x, quadToAdd.y );
			if (this.quadCache[hash]) continue;

			var quad = new Quad( quadToAdd.x, quadToAdd.y );
			if (quad.isInside(position, this.viewRadius) === FULL_OUTSIDE) continue;
			var lod  = lodLevelFromDistance( distanceFromQuad(quad.x, quad.y) );
			loadQuadQueue.push({
				quad: quad,
				lod: lod
				// range: { min: Math.max(lod - 1, 0),
				// 		 max: lod + 1 }
			});

			this.quadCache[quad.hash] = quad;
			var neighboursToAdd = [
				{ x: quad.x + this.quadSize, y: quad.y, neighbour: 'west',  neighbourOf: 'east' }, // West
				{ x: quad.x - this.quadSize, y: quad.y, neighbour: 'east',  neighbourOf: 'west' }, // East
				{ x: quad.x, y: quad.y + this.quadSize, neighbour: 'north', neighbourOf: 'south' }, // North
				{ x: quad.x, y: quad.y - this.quadSize, neighbour: 'south', neighbourOf: 'north' }, // South
			];

			for (var i=0; i<neighboursToAdd.length; ++i) {
				var neighbourToAdd = neighboursToAdd[i],
					nHash = this.hashQuad(neighbourToAdd.x, neighbourToAdd.y);
				if (this.quadCache[nHash]) {
					quad.neighbours[ neighbourToAdd.neighbour ] = this.quadCache[nHash];
					this.quadCache[nHash].neighbours[ neighbourToAdd.neighbourOf ] = quad;
				} else {
					checkQuadsQueue.push( neighbourToAdd );
				}
			}
		}

		for (var hash in deleteQueue) {
			this.quadCache[hash].unload();
			delete this.quadCache[hash];
		}


		var noVisibleQuads = true;
		for (var hash in this.quadCache) {
			noVisibleQuads = false;
		}

		if (noVisibleQuads) this.initialize();

	};

	this.quadCache = { };
	this.quadCount = function(){

		var count = 0;
		for (var hash in this.quadCache) {
			++count;
		}

		return count;
	};

	this.quadSize = Settings.quadSize;
	this.quadRadius = 2*Math.sqrt(this.quadSize/2)

	var world = this;

	////////////////////////////////////////////////////
	//
	// 				QUAD
	//
	////////////////////////////////////////////////////

	var Quad = function(x, y){


		this.x = x;
		this.y = y;
		this.hash = world.hashQuad(x, y);
		this.loadedLOD = {
			min: null,
			max: null
		};
		this.updating = false;
		this.index = quadIndex++;

		// Is the quad in the viewable range: return FULL_INSIDE, FULL_OUTSIDE, PARTIAL_INSIDE
		this.isInside = function(point, radius) {
			var centerX  = this.x + world.quadSize/2,
				centerY  = this.y + world.quadSize/2,
				diffX    = (point.x) - centerX,
				diffY    = (point.y) - centerY,
				distance = diffX*diffX + diffY*diffY,
				inRadius = world.quadRadius*world.quadRadius;
			if ( distance + inRadius <= radius*radius ) {
				return FULL_INSIDE;
			}

			if ( distance - inRadius <= radius*radius ) {
				return PARTIAL_INSIDE;
			}

			return FULL_OUTSIDE;

		};

		this.neighbours = {
			north: null,
			west: null,
			south: null,
			east: null
		};
		this.north = function() { return this.neighbours.north; };
		this.east = function() { return this.neighbours.east; };
		this.south = function() { return this.neighbours.south; };
		this.west = function() { return this.neighbours.west; };

		this.points   = null;
		this.slopes   = null;
		this.elements = [];

		this.heightmap = null;
		this.generate = function(lod) {

			var my = this;
			return new Promise(function GeneratedQuad(resolve, reject){

					var time = (new Date()).getTime(),
						myWorker = new Worker("js/generatorWorker.js");
					my.worker = myWorker;
					my.resolve = resolve;

					myWorker.addEventListener("message", function (oEvent) {

						var time = (new Date()).getTime(),
							quad = world.quadCache[oEvent.data.hash];
						if (quad) {
							quad.worker = null;
							var	points    = new Float32Array(oEvent.data.points),
								slopes    = new Float32Array(oEvent.data.slopes),
								heightmap = (oEvent.data.heightmap? new Uint8Array(oEvent.data.heightmap) : null);
							quad.points = points;
							quad.slopes = slopes;
							if (heightmap) {
								quad.heightmap = ctx.createImageData( Settings.quadTiles+1, Settings.quadTiles+1 );
								quad.heightmap.data.set(heightmap);
							}

							quad.newlod = lod;
							for (var i=0; i<oEvent.data.elements.length; ++i) {
								var el = oEvent.data.elements[i],
									elements = {
										lodSections: el.lodSections,
										lodLevel: el.lodLevel,
										elements:{},
									};

								for (var elementsName in el) {
									if (elementsName == "lodSections" ||
										elementsName == "lodLevel") continue;
									elements.elements[elementsName] = {data: new Uint32Array(el[elementsName])};
									elements.elements[elementsName].length = elements.elements[elementsName].data.length;
								}
								quad.elements[el.lodLevel] = elements;

							}

							resolve({myWorker: this, quad: quad});
						} else {
							// Quad has already been deleted (too old)
							resolve({myWorker: this, quad: null});
						}

					}, false);

					workerDetails = {
						seed1:Settings.seed1,
						seed2:Settings.seed2,
						scaleXZ:Settings.scaleXZ,
						sections:LOD_Spaces[lod].tiles,
						scaleY_World:Settings.scaleY_World,
						scaleSteepness_World:Settings.scaleSteepness_World,
						scaleNormal_World:Settings.scaleNormal_World,
						verticalSkirtLength:Settings.verticalSkirtLength,
						x:my.x,
						y:my.y,
						quadSize:world.quadSize,
						hash:my.hash,
						lod:lod,
						// lodRange:range,
						includeCanvas:(Settings.includeCanvas && lod == 0),
					};

					transferringObjects = [];

					myWorker.postMessage(workerDetails, transferringObjects); // start the worker.

			});


		};
		this.unload = function() {

			try {

				// Self delete and remove from neighbours
				if (this.neighbours.north) delete this.neighbours.north.neighbours.south;
				if (this.neighbours.south) delete this.neighbours.south.neighbours.north;
				if (this.neighbours.west)  delete this.neighbours.west.neighbours.east;
				if (this.neighbours.east)  delete this.neighbours.east.neighbours.west;

				delete this.neighbours;
				if (this.heightmap) delete this.heightmap;

				clearQuad(this);

			} catch(e) {
				// Most likely this quad has already been unloaded
			}
		};

	};

};

