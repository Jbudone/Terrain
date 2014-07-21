
// TODO
//	> filter blending?
//	> texture blending (slope, normal, height-bands) + detail textures; texture bleeding; 3d noise for bumpy ground & dirty surfaces; specular for snow & ice; watery ground?  filter for vegetation; lighting
//
//	> use lighting & normals
//
//
//	> heightmap: random boulders
// 	> allow LOD with base power 3; switch between base power 2 (with LOD) and base power 3
//
//
//
//	> FIREFOX support
// 	> main.js with event handling & proper loading
// 	> CLEAN and refactor everything
// 	> Documentation
// 	> better abstraction & architecture setup
// 	> abstract settings
// 	> zoom out of quadtree to show rebuilding process (Eagle Eye); extend far plane
// 	> show wireframe; switch between wireframe / solid
// 	> git
// 	> allow both webworkers & async mode (importscript for loading noises)
// 	> settings to enable/disable heightmap; LOD0 loads heightmap
// 	> draw camera point on map
// 	> elegant way to swap between skybox textures & heightmap generators + textures
// 	> better fog effects
// 	> safe fail (modernizr) check if browser supports these: webworkers, canvas, webgl, transferableobjects
// 	> NOTE: quadSize (speed: 8192, quality: 1024) -- cant fix without using INT elements, not supported yet
// 	> build script (console.log for debug mode)
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
// 	> BUG: tri's drawn double sided
// 	> BUG: voronoi noise with negative numbers
// 	> BUG: when moving really fast along the canvas, sometimes missing quads occur 
// 	> BUG: quads being unloaded twice
// 	> BUG: scalability between quadsize, section count, and LOD's  (using fixed numbers until patched)
// 	> BUG: quad edges show up as west(right), east(left)
// 	> BUG: LOD3 and up doesn't work
// 	> FIXME: putting elements and vao in same arraybuffer (NOT OKAY!)
//
// 	> Presentation: LOD; Powers of 2 vs. 3; Noise blending

var canvas    = document.getElementById('heightmap'),
	ctx       = canvas.getContext('2d'),
	heightmap = ctx.getImageData(0, 0, canvas.width, canvas.height),
	position  = {x:0, y:0},
	world = null,
	loadQuadQueue = [],
	generatedQuadQueue = [],
	workersWorking = 0,
	checkWorkerQueue = function(){
		if (loadQuadQueue.length && workersWorking < 2) {
			var loadInfo = loadQuadQueue.shift(),
				quad = loadInfo.quad,
				clearedThisQuad = false;
			++workersWorking;
			loadInfo.range.min = 0;
			if (Settings.useLOD) loadInfo.range.max = 6;
			else loadInfo.range.max = 0;
			quad.generate(loadInfo.range).then(function(obj){
				generatedQuadQueue.push(obj);
				// var myWorker = obj.myWorker,
				// 	quad     = obj.quad;
				// // console.log("Quad generated: "+quad.heightmap.data.length);
				// delete myWorker;
				// world.workers_working--;
				// // setTimeout(updateCanvas, 500);

				// var time = (new Date()).getTime();
				// bufferQuad(quad);
				// var endTime = (new Date()).getTime();
				// console.log("Time buffering Quad: "+(endTime-time));
				// --workersWorking;
				// clearedThisQuad = true;
				// quad.updating = false;
				// // setTimeout(checkWorkerQueue, 100);
			});

			setTimeout(function(){ if (!clearedThisQuad){ --workersWorking; quad.updating=false; } }, 8000); // TODO: remove this bug
		}
	};

	setInterval( checkWorkerQueue, 10 );

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
				range: { min: Math.max(lod - 1, 0),
						 max: lod + 1 }
			});
		}
		// setTimeout(checkWorkerQueue, 100);
	},

	updateCanvas = function(){

		ctx.fillRect(0, 0, canvas.width, canvas.height);
		for (var hash in world.quadCache) {
			var quad = world.quadCache[hash];
			if (quad.heightmap) {
				ctx.putImageData( quad.heightmap, (-quad.x  + position.x) - canvas.width/4, (-quad.y   + position.y) - canvas.height/4, 0, 0, world.quadSize, world.quadSize );
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


	// generate height at location
	var simplex = new Simplex(289.0);
	var voronoi = new Voronoi();
	this.getHeightAt = function(point) {
		var scale = 0.05,
			height = voronoi.noise( point.x*scale, point.y*scale );
		var F1 = height.x,
			F2 = height.y;
		height = height.y;
		// var val = F2 * 250.0/(1.5/1.0);
		var facets = 0.1 + (F2 - F1),
			t      = Math.max(0.0, Math.min(1.0, (F1 - 0.05) / (0.1 - 0.05))),
			dots   = t * t * (3.0 - 2.0 * t),
			n      = facets * dots;
		height = n;
			// height = simplex.snoise( point.x*scale, point.y*scale );
		return height;
	};


	this.hashQuad = function(x, y){ return x + y*274783; }; // TODO: better hash 

	this.viewRadius = 16000;//1850;
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
				range: { min: Math.max(lod - 1, 0),
						 max: lod + 1 }
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
		// setTimeout(checkWorkerQueue, 100);

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
	// this.edgeList = []; // Quads which are partially inside/outside the viewable range

		// FIXME JB: TEST LOD3
	this.quadSize = 6561;//2048;//8192;
	this.quadRadius = 2*Math.sqrt(this.quadSize/2)

	var world = this;
	this.workers_working=0;
	this.workers_created=0;

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
		this.generate = function(range) {

			var my = this;
			return new Promise(function GeneratedQuad(resolve, reject){

					var time = (new Date()).getTime();
					var myWorker = new Worker("js/generatorWorker.js");
					world.workers_working++;
					world.workers_created++;

					myWorker.addEventListener("message", function (oEvent) {
						// console.log("Called back by the worker!\n");


						var time = (new Date()).getTime();
						var quad = world.quadCache[oEvent.data.hash];
						if (quad) {
							// quad.heightmap = ctx.createImageData( world.quadSize+1, world.quadSize+1 );
							var time1 = (new Date()).getTime();
							// var heightmap = new Uint8Array(oEvent.data.heightmap);
							var time1End = (new Date()).getTime();
							// console.log("	heightmap fetch: "+(time1End-time1));
							time1 = (new Date()).getTime();
							var	points = new Float32Array(oEvent.data.points);
							time1End = (new Date()).getTime();
							// console.log("	points fetch: "+(time1End-time1));
							time1 = (new Date()).getTime();
							var	slopes = new Float32Array(oEvent.data.slopes);
							time1End = (new Date()).getTime();
							// console.log("	slopes fetch: "+(time1End-time1));
								// elements = new Uint16Array(oEvent.data.elements);
							time1 = (new Date()).getTime();
							// quad.heightmap.data.set(heightmap); // TODO: is this the fastest way?
							// quad.heightmap = heightmap;
							time1End = (new Date()).getTime();
							// console.log("	heightmap copy: "+(time1End-time1));
							time1 = (new Date()).getTime();
							quad.points = points;
							time1End = (new Date()).getTime();
							// console.log("	points copy: "+(time1End-time1));
							time1 = (new Date()).getTime();
							quad.slopes = slopes;
							time1End = (new Date()).getTime();
							// console.log("	slopes copy: "+(time1End-time1));


							time1 = (new Date()).getTime();
							// quad.elements = elements;

							// quad.elements = {};
							// for (var bufferName in oEvent.data.elements) {
							// 	var buffer = oEvent.data.elements[bufferName],
							// 		elements = new Uint16Array(buffer);
							// 	quad.elements[bufferName] = {elements:elements};
							// }
							for (var i=0; i<oEvent.data.elements.length; ++i) {
								var el = oEvent.data.elements[i],
									elements = {
										lodSections: el.lodSections,
										lodLevel: el.lodLevel,
										elements:{},
											// inner:  new Uint16Array(el.inner),
											// top:    new Uint16Array(el.top),
											// bottom: new Uint16Array(el.bottom),
											// right:  new Uint16Array(el.right),
											// left:   new Uint16Array(el.left),
										// };
									};

								for (var elementsName in el) {
									elements.elements[elementsName] = new Uint16Array(el[elementsName]);
								}
								quad.elements[el.lodLevel] = elements;

								if (quad.loadedLOD.min === null || el.lodLevel < quad.loadedLOD.min) {
									quad.loadedLOD.min = el.lodLevel;
								} else if (quad.loadedLOD.max === null || el.lodLevel > quad.loadedLOD.max) {
									quad.loadedLOD.max = el.lodLevel;
								}
							}

							time1End = (new Date()).getTime();
							// console.log("	elements copy: "+(time1End-time1));

							// console.log("Quad points (transfered): "+quad.points.length);
							var endTime = (new Date()).getTime();
							// console.log("Time copying Quad: "+(endTime-time));
							resolve({myWorker: this, quad: quad});

							// quad.heightmap.data = oEvent.data.heightmap;

							// resolve(oEvent.data.heightmap);
						}

					}, false);

					workerDetails = {
						x:my.x,
						y:my.y,
						quadSize:world.quadSize,
						hash:my.hash,
						lodRange:range
					};

					transferringObjects = [];

					if (my.points && my.slopes) {
						workerDetails.points = my.points.buffer;
						workerDetails.slopes = my.slopes.buffer;
						workerDetails.pointsLOD = my.loadedLOD.min;

						transferringObjects = [
							workerDetails.points,
							workerDetails.slopes ];

					}

					myWorker.postMessage(workerDetails, transferringObjects); // start the worker.
					var endTime = (new Date()).getTime();
					// console.log("Time preparing Quad generation: "+(endTime-time));

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
				delete this.heightmap;

				clearQuad(this);

			} catch(e) {
				// Most likely this quad has already been unloaded
			}
		};

	};

};





























































var Voronoi = function(){

	this.noise = function(x,y){

		// JB: massive issues with negative numbers
		x = Math.abs(x);
		y = Math.abs(y);


		var K = 0.142857142857, // 1/7
			Ko = 0.428571428571, // 3/7
			jitter = 1.0, // Less gives more regular pattern
			magic = 289;

		var permute = function(x) {
			return {
				x: ((34*x.x + 1.0) * x.x) % magic,
				y: ((34*x.y + 1.0) * x.y) % magic,
				z: ((34*x.z + 1.0) * x.z) % magic };
		}

		var Pi = { x: Math.floor(x) % magic,
				   y: Math.floor(y) % magic },
			Pf = { x: x - parseInt(x),
				   y: y - parseInt(y) },
			oi = { x: -1.0, y: 0.0, z: 1.0 },
			of = { x: -0.5, y: 0.5, z: 1.5 },
			px = permute({ x: oi.x + Pi.x, y: oi.y + Pi.x, z: oi.z + Pi.x }),
			p  = permute({ x: px.x + Pi.y + oi.x, y: px.x + Pi.y + oi.y, z: px.x + Pi.y + oi.z }),
			ox = { x: (p.x*K) - parseInt(p.x*K) - Ko,
				   y: (p.y*K) - parseInt(p.y*K) - Ko,
				   z: (p.z*K) - parseInt(p.z*K) - Ko },
			oy = {  x: (parseInt(p.x*K) % 7)*K - Ko,
					y: (parseInt(p.y*K) % 7)*K - Ko,
					z: (parseInt(p.z*K) % 7)*K - Ko },
			dx = {  x: Pf.x + 0.5 + jitter*ox.x,
					y: Pf.x + 0.5 + jitter*ox.y,
					z: Pf.x + 0.5 + jitter*ox.z },
			dy = {  x: Pf.y - of.x + jitter*oy.x,
					y: Pf.y - of.y + jitter*oy.y,
					z: Pf.y - of.z + jitter*oy.z },
			d1 = {  x: dx.x*dx.x + dy.x*dy.x,
					y: dx.y*dx.y + dy.y*dy.y,
					z: dx.z*dx.z + dy.z*dy.z };

			p  = permute({ x: px.y + Pi.y + oi.x, y: px.y + Pi.y + oi.y, z: px.y + Pi.y + oi.z });
			ox = {  x: (p.x*K) - parseInt(p.x*K) - Ko,
					y: (p.y*K) - parseInt(p.y*K) - Ko,
					z: (p.z*K) - parseInt(p.z*K) - Ko };
			oy = {  x: (parseInt(p.x*K) % 7)*K - Ko,
					y: (parseInt(p.y*K) % 7)*K - Ko,
					z: (parseInt(p.z*K) % 7)*K - Ko };
			dx = {  x: Pf.x - 0.5 + jitter*ox.x,
					y: Pf.x - 0.5 + jitter*ox.y,
					z: Pf.x - 0.5 + jitter*ox.z };
			dy = {  x: Pf.y - of.x + jitter*oy.x,
					y: Pf.y - of.y + jitter*oy.y,
					z: Pf.y - of.z + jitter*oy.z };
			d2 = {  x: dx.x*dx.x + dy.x*dy.x,
					y: dx.y*dx.y + dy.y*dy.y,
					z: dx.z*dx.z + dy.z*dy.z };

			p  = permute({ x: px.z + Pi.y + oi.x, y: px.z + Pi.y + oi.y, z: px.z + Pi.y + oi.z });
			ox = {  x: (p.x*K) - parseInt(p.x*K) - Ko,
					y: (p.y*K) - parseInt(p.y*K) - Ko,
					z: (p.z*K) - parseInt(p.z*K) - Ko };
			oy = {  x: (parseInt(p.x*K) % 7)*K - Ko,
					y: (parseInt(p.y*K) % 7)*K - Ko,
					z: (parseInt(p.z*K) % 7)*K - Ko };
			dx = {  x: Pf.x - 1.5 + jitter*ox.x,
					y: Pf.x - 1.5 + jitter*ox.y,
					z: Pf.x - 1.5 + jitter*ox.z };
			dy = {  x: Pf.y - of.x + jitter*oy.x,
					y: Pf.y - of.y + jitter*oy.y,
					z: Pf.y - of.z + jitter*oy.z };
			d3 = {  x: dx.x*dx.x + dy.x*dy.x,
					y: dx.y*dx.y + dy.y*dy.y,
					z: dx.z*dx.z + dy.z*dy.z };


		var d1a = { x: (d1.x < d2.x ? d1.x : d2.x), y: (d1.y < d2.y ? d1.y : d2.y), z: (d1.z < d2.z ? d1.z : d2.z) };
		d2 = { x: (d1.x > d2.x ? d1.x : d2.x), y: (d1.y > d2.y ? d1.y : d2.y), z: (d1.z > d2.z ? d1.z : d2.z) };
		d2 = { x: (d2.x < d3.x ? d2.x : d3.x), y: (d2.y < d3.y ? d2.y : d3.y), z: (d2.z < d3.z ? d2.z : d3.z) };
		d1 = { x: (d1a.x < d2.x ? d1a.x : d2.x), y: (d1a.y < d2.y ? d1a.y : d2.y), z: (d1a.z < d2.z ? d1a.z : d2.z) };
		d2 = { x: (d1a.x > d2.x ? d1a.x : d2.x), y: (d1a.y > d2.y ? d1a.y : d2.y), z: (d1a.z > d2.z ? d1a.z : d2.z) };

		d1.x = (d1.x < d1.y) ? d1.x : d1.y;
		d1.y = (d1.x < d1.y) ? d1.y : d1.x;
		d1.x = (d1.x < d1.z) ? d1.x : d1.z;
		d1.z = (d1.x < d1.z) ? d1.z : d1.x;

		// d1.y = (d1.y < d2.y ? d1.y : d2.y);
		// d1.z = (d1.z < d2.z ? d1.z : d2.z);

		// JB
		d2.x = (d2.x < d2.y) ? d2.x : d2.y;
		d2.y = (d2.x < d2.y) ? d2.y : d2.x;
		d2.x = (d2.x < d2.z) ? d2.x : d2.z;
		d2.z = (d2.x < d2.z) ? d2.z : d2.x;
		d1.y = d2.x;

		// d1.y = (d1.y < d1.z ? d1.y : d1.z);
		// d1.y = (d1.y < d2.x ? d1.y : d2.x);

			
		return { x: Math.sqrt(d1.x), y: Math.sqrt(d1.y) };
	};

	/*
	this.cellSize = 10;
	this.grid = {};

	this.noise = function(x,y){
		x = Math.abs(x) + 1000;
		y = Math.abs(y) + 1000;

		// find square hash from x,y coord
		var squareX = Math.floor(x/this.cellSize) + (x < 0? -1 : 0),
			squareY = Math.floor(y/this.cellSize) + (y < 0? -1 : 0),
			hash    = (x*1640531513 ^ y*2654435789) % 15485863;

		var Grid = this.grid;

		// TODO: find nearest cells in square and neighbour squares
		var Square = function(x,y){
			this.x = x;
			this.y = y;
			this.hash = (x*1640531513 ^ y*2654435789) % 15485863;

			var r = new Random(hash);
			this.cellcount = 1;// Math.floor(r.random() * 10);
			this.cells = [];
			for (var i=0; i<this.cellcount; ++i) {
				this.cells.push({
					x: ((r.random() * Math.pow(10,i)) << 2) % 10,
					y: ((r.random() * Math.pow(10,i)) << 3) % 10
				});
			}

			this.closestDistance = function(x,y) {

				var nearestDistance = 999999.0,
					nearestIndex    = 0;
				for (var i=0; i<this.cells.length; ++i) {
					var cell = this.cells[i],
						diffX = x - cell.x,
						diffY = y - cell.y;
					if (diffX*diffX + diffY*diffY < nearestDistance) {
						nearestDistance = diffX*diffX + diffY*diffY;
						nearestIndex = i;
					}
				}

				return Math.sqrt(nearestDistance);
			};

		};
		var createSquare = function(x,y){
			var hash = (x*1640531513 ^ y*2654435789) % 15485863;

			if (Grid[hash]) return Grid[hash];
			Grid[hash] = new Square(x,y);
			return Grid[hash];
		};
		var t = this.cellSize;
		var localgrid = {
			squares: {
				'northwest' : createSquare( squareX-t, squareY-t ),
				'north'     : createSquare( squareX,   squareY-t ),
				'northeast' : createSquare( squareX+t, squareY-t ),
				'east'      : createSquare( squareX+t, squareY   ),
				'southeast' : createSquare( squareX+t, squareY+t ),
				'south'     : createSquare( squareX,   squareY+t ),
				'southwest' : createSquare( squareX-t, squareY+t ),
				'west'      : createSquare( squareX-t, squareY   ),
				'center'    : createSquare( squareX,   squareY   )
			}
		};

		var nearestDistance = 999999.0;
		for (var square in localgrid.squares) {
			var distance = localgrid.squares[square].closestDistance(x,y);
			if (distance < nearestDistance) nearestDistance = distance;
		}


		return nearestDistance;
	};
	*/

	// TODO:
	// 	> split plane into grid
	// 	> each grid gets a random number of points <--- SEED!!
	// 	> hashshum for grid cell  (note: infinite width/height of world)
	// 	> distribution function: Bridson's fast poisson disk sampling 
	//
	//
	// 	NOTE: able to cache nearest hitpoints?

};


var Simplex = function(magic){

	this.magic = magic;

	/*
	vec3 mod289(vec3 x) {
		return x - floor(x * (1.0 / 289.0)) * 289.0;
	}

	vec2 mod289(vec2 x) {
		return x - floor(x * (1.0 / 289.0)) * 289.0;
	}

	vec3 permute(vec3 x) {
		return mod289(((x*34.0)+1.0)*x);
	}
	*/


	this.permute = function(vec) {

		var nvec = {
			x: vec.x,
			y: vec.y,
			z: vec.z
		};

		nvec.x = ((nvec.x * 34.0) + 1.0) * nvec.x;
		nvec.y = ((nvec.y * 34.0) + 1.0) * nvec.y;
		nvec.z = ((nvec.z * 34.0) + 1.0) * nvec.z;

		nvec.x = nvec.x - Math.floor( nvec.x * (1.0 / this.magic) ) * this.magic;
		nvec.y = nvec.y - Math.floor( nvec.y * (1.0 / this.magic) ) * this.magic;
		nvec.z = nvec.z - Math.floor( nvec.z * (1.0 / this.magic) ) * this.magic;

		return nvec;
	};

	this.snoise = function(x, y)
	{
		var Cx = 0.211324865405187,  // (3.0-sqrt(3.0))/6.0
			Cy = 0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
			Cz = -0.577350269189626,  // -1.0 + 2.0 * C.x
			Cw = 0.024390243902439; // 1.0 / 41.0

		// First corner
		var ix  = Math.floor( x + (x*Cy + y*Cy) ),
			iy  = Math.floor( y + (x*Cy + y*Cy) ),
			x0x = x - ix + (ix*Cx + iy*Cx),
			x0y = y - iy + (ix*Cx + iy*Cx);

		// Other corners
		//i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
		//i1.y = 1.0 - i1.x;
		var i1x = (x0x > x0y) ? 1.0 : 0.0,
			i1y = (x0x > x0y) ? 0.0 : 1.0;
		// x0 = x0 - 0.0 + 0.0 * C.xx ;
		// x1 = x0 - i1 + 1.0 * C.xx ;
		// x2 = x0 - 1.0 + 2.0 * C.xx ;
		var x12x = x0x + Cx,
			x12y = x0y + Cx,
			x12z = x0x + Cz,
			x12w = x0y + Cz;
		x12x -= i1x;
		x12y -= i1y;

		// Permutations
		ix = ix - Math.floor( ix * (1.0 / this.magic) ) * this.magic;
		iy = iy - Math.floor( iy * (1.0 / this.magic) ) * this.magic; // Avoid truncation effects in permutation
		pvec = { x: iy, y: iy + i1y, z: iy + 1.0 };
		pvec = this.permute( pvec );
		pvec.x += ix;
		pvec.y += ix + i1x;
		pvec.z += ix + 1.0;
		p = this.permute( pvec );


		mvec1 = { x: x0x*x0x + x0y*x0y, y: x12x*x12x + x12y*x12y, z: x12z*x12z + x12w*x12w };
		mvec1 = { x: Math.max( 0.5 - mvec1.x, 0.0 ), y: Math.max( 0.5 - mvec1.y, 0.0 ), z: Math.max( 0.5 - mvec1.z, 0.0 ) };
		m = { x: Math.pow(mvec1.x, 4), y: Math.pow(mvec1.y, 4), z: Math.pow(mvec1.z, 4) };

		// Gradients: 41 points uniformly over a line, mapped onto a diamond.
		// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

		vecx = { x: 2.0 * (p.x * Cw - parseInt(p.x * Cw)) - 1.0,
				 y: 2.0 * (p.y * Cw - parseInt(p.y * Cw)) - 1.0,
				 z: 2.0 * (p.z * Cw - parseInt(p.z * Cw)) - 1.0 };
		vech = { x: Math.abs( vecx.x ) - 0.5,
				 y: Math.abs( vecx.y ) - 0.5,
				 z: Math.abs( vecx.z ) - 0.5 };
		vecox = { x: Math.floor( vecx.x + 0.5 ),
				  y: Math.floor( vecx.y + 0.5 ),
				  z: Math.floor( vecx.z + 0.5 ) };
		veca0 = { x: vecx.x - vecox.x,
				  y: vecx.y - vecox.y,
				  z: vecx.z - vecox.z };

		// Normalise gradients implicitly by scaling m
		// Approximation of: m *= inversesqrt( a0*a0 + h*h );
		m.x *= 1.79284291400159 - 0.85373472095314 * ( veca0.x * veca0.x + vech.x * vech.x );
		m.y *= 1.79284291400159 - 0.85373472095314 * ( veca0.y * veca0.y + vech.y * vech.y );
		m.z *= 1.79284291400159 - 0.85373472095314 * ( veca0.z * veca0.z + vech.z * vech.z );

		// Compute final noise value at P
		vecg = { x: veca0.x * x0x + vech.x * x0y,
				 y: veca0.y * x12x + vech.y * x12y,
				 z: veca0.z * x12z + vech.z * x12w };

		val = 130.0 * ( m.x * vecg.x + m.y * vecg.y + m.z * vecg.z );
		return val;
	}
};


var Perlin = function(persistence, octaves){

	this.persistence = persistence;
	this.octaves = octaves;

	this.noise = function(x, y){
		var seed = ( x << 18 ) | ( y << 4 ) | 49734321;

		// Robert Jenkins' 32 bit integer hash function.
		// See http://www.concentric.net/~ttwang/tech/inthash.htm (original)
		// and http://stackoverflow.com/questions/3428136/javascript-integer-math-incorrect-results/3428186#3428186 (JavaScript version)
		seed = ((seed + 0x7ed55d16) + (seed << 12))  & 0xffffffff;
		seed = ((seed ^ 0xc761c23c) ^ (seed >>> 19)) & 0xffffffff;
		seed = ((seed + 0x165667b1) + (seed << 5))   & 0xffffffff;
		seed = ((seed + 0xd3a2646c) ^ (seed << 9))   & 0xffffffff;
		seed = ((seed + 0xfd7046c5) + (seed << 3))   & 0xffffffff;
		seed = ((seed ^ 0xb55a4f09) ^ (seed >>> 16)) & 0xffffffff;
		return (seed & 0xfffffff) / 0x10000000;


		// var n = x + y * 57;
		// n = (n<<13) ^ n;
		// var val = ( 1.0 - ( (n * (n * n * 15731 + 789221) + 1376312589) & 2147483647) / 1073741824.0);  
		// return val;
	};

	this.smoothNoise = function(x, y){
		var corners = ( this.noise(x-1, y-1)+this.noise(x+1, y-1)+this.noise(x-1, y+1)+this.noise(x+1, y+1) ) / 16;
		var sides   = ( this.noise(x-1, y)  +this.noise(x+1, y)  +this.noise(x, y-1)  +this.noise(x, y+1) ) /  8;
		var center  =  this.noise(x, y) / 4;
		return corners + sides + center;
	};

	this.interpolate = function(a, b, x){
		var ft = x * Math.PI;
		var f = (1 - Math.cos(ft)) * .5;

		return  a*(1-f) + b*f;
	};

	this.interpolatedNoise = function(x, y){

		var integer_X    = parseInt(x);
		var fractional_X = x - integer_X;

		var integer_Y    = parseInt(y);
		var fractional_Y = y - integer_Y;

		var v1 = this.smoothNoise(integer_X,     integer_Y);
		var v2 = this.smoothNoise(integer_X + 1, integer_Y);
		var v3 = this.smoothNoise(integer_X,     integer_Y + 1);
		var v4 = this.smoothNoise(integer_X + 1, integer_Y + 1);

		var i1 = this.interpolate(v1 , v2 , fractional_X);
		var i2 = this.interpolate(v3 , v4 , fractional_X);

		return this.interpolate(i1 , i2 , fractional_Y);
	};

	this.perlinNoise = function(x, y){
		var total = 0;
		var p = this.persistence;
		var n = this.octaves;

		for (var i=0; i<n; ++i) {
			var frequency = Math.pow(2,i);
			var amplitude = Math.pow(p,i);
			total = total + this.interpolatedNoise(x * frequency, y * frequency) * amplitude;
		}

		return total;
	};
};
