
onmessage = function (oEvent) {

	var seed1 = oEvent.data.seed1,
		seed2 = oEvent.data.seed2;



	var simplex = new Simplex(seed1);
	var voronoi = new Voronoi(seed2);
	var logged = 0;
	var clamp = function(value, min, max) {
		return Math.max( Math.min( value, max ), min );
	};
	var getHeightAt = function(point) {

		/*
		var scale = 0.0003;
		var height  =  1 * Math.abs( simplex.noise( point.x * scale, point.y * scale ) ); scale /= 2;
			height +=  2 * Math.abs( simplex.noise( point.x * scale, point.y * scale ) ); scale /= 2;
			height +=  4 * Math.abs( simplex.noise( point.x * scale, point.y * scale ) ); scale /= 2;
			height +=  8 * Math.abs( simplex.noise( point.x * scale, point.y * scale ) ); scale /= 2;
			height += 16 * Math.abs( simplex.noise( point.x * scale, point.y * scale ) ); scale /= 2;
			height += 20 * Math.abs( simplex.noise( point.x * scale, point.y * scale ) ); scale /= 2;
			height += 32 * Math.abs( simplex.noise( point.x * scale, point.y * scale ) ); scale /= 2;
			height += 50 * Math.abs( simplex.noise( point.x * scale, point.y * scale ) ); scale /= 2;
			height += 64 * Math.abs( simplex.noise( point.x * scale, point.y * scale ) ); scale /= 2;
			height += 80 * Math.abs( simplex.noise( point.x * scale, point.y * scale ) ); scale /= 2;
		height -= 30;
		height /= 6;

		// var selector = Noise.flatten( Noise.multifractalRidgid( simplex, {x:point.x*0.001, y:point.y*0.001}, 2, 3 ), 2.8, -0.45 );
		// if (selector < 0) selector = 0.1;
		// if (selector > 1) selector = 1;

		// height *= selector;

		// height = Noise.flatten( height, 4, -10 );
		if (height < 0 ) return 0;
		return height;
		*/

		// return simplex.noise(point.x, point.y);
		// return simplex.noise(point.x * 0.001, point.y * 0.001);
		// return Math.abs( simplex.noise( point.x * 0.001, point.y * 0.001 ) );
		// return ( 1 * Math.abs( simplex.noise( point.x * 0.001,   point.y * 0.001 ) ) +
		// 		 2 * Math.abs( simplex.noise( point.x * 0.0005,  point.y * 0.0005 ) ) +
		// 		 4 * Math.abs( simplex.noise( point.x * 0.0002,  point.y * 0.0002 ) ) +
		// 		 8 * Math.abs( simplex.noise( point.x * 0.0001,  point.y * 0.0002 ) )
		// 		) / 10;
		// return voronoi.noise( point.x * 0.001, point.y * 0.001 ).x;
		// return voronoi.noise( point.x * 0.001, point.y * 0.001 ).y;

		var height = 0.0;
			turbulence = Noise.basicTurbulence( simplex, {x:point.x*0.1, y:point.y*0.1}, 2, 4 );
			selector = Noise.flatten( Noise.multifractalRidgid( simplex, {x:point.x*0.001, y:point.y*0.001}, 2, 3 ), 2.8, -0.45 );
		if (selector < 0) selector = 0;
		if (selector > 1) selector = 1;

			

		/////
		//
		//			MOUNTAINS
		//
		/////


		// Mountain Area
		var mountains  = 1  *  Math.abs( simplex.noise(point.x * 0.0005, point.y * 0.0005) );
		mountains += 2  *  Math.abs( simplex.noise(point.x * 0.0002, point.y * 0.0002) );
		mountains += 4  *  Math.abs( simplex.noise(point.x * 0.0001, point.y * 0.0001) );
		mountains += 8  *  Math.abs( simplex.noise(point.x * 0.00005, point.y * 0.00005) );
		mountains += 16 *  Math.abs( simplex.noise(point.x * 0.00002, point.y * 0.00002) );
		mountains += 32 *  Math.abs( simplex.noise(point.x * 0.00001, point.y * 0.00001) );
		mountains += 64 *  Math.abs( simplex.noise(point.x * 0.000005, point.y * 0.000005) );

		// Restrict Mountain Range
		mountains -= 32 *  Math.abs( simplex.noise(point.x * 0.00002 + 1000, point.y * 0.00002 + 1000) );
		mountains -= 64 *  Math.abs( simplex.noise(point.x * 0.00001 + 1000, point.y * 0.00001 + 1000) );
		mountains /= 12;
		mountains -= 1;
		mountains = Noise.flatten( mountains, 3.5, -1 );

		// Add Ridge-lines
		// var ridges = Math.abs(voronoi.noise(point.x*0.0002, point.y*0.0002).y);
		// if (ridges < 0.5) ridges = 0.5;
		// ridges -= 0.5;
		// mountains *= 1.0 + ridges;

		if (mountains < 0) mountains = 0;

		/////
		//
		//			LAND
		//
		/////

		var land = 0;
		var scaleLand = 0.5;
		// land += 16 * Math.abs( simplex.noise(point.x *scaleLand* 0.00002 + 1000, point.y  * scaleLand * 0.00002 + 1000) );
		// land += 16 * Math.abs( simplex.noise(point.x *scaleLand* 0.00002 + 2000, point.y  * scaleLand * 0.00002 + 2000) );
		// land += 16 * Math.abs( simplex.noise(point.x *scaleLand* 0.00002 + 3000, point.y  * scaleLand * 0.00002 + 3000) );
		// land += 32 * Math.abs( simplex.noise(point.x *scaleLand* 0.00001 + 1000, point.y  * scaleLand * 0.00001 + 1000) );
		// land += 32 * Math.abs( simplex.noise(point.x *scaleLand* 0.00001 + 2000, point.y  * scaleLand * 0.00001 + 2000) );
		// land += 32 * Math.abs( simplex.noise(point.x *scaleLand* 0.00001 + 3000, point.y  * scaleLand * 0.00001 + 3000) );
		// land += 64 * Math.abs( simplex.noise(point.x *scaleLand* 0.000005 + 1000, point.y * scaleLand * 0.000005 + 1000) );
		// land += 64 * Math.abs( simplex.noise(point.x *scaleLand* 0.000005 + 2000, point.y * scaleLand * 0.000005 + 2000) );
		// land += 64 * Math.abs( simplex.noise(point.x *scaleLand* 0.000005 + 3000, point.y * scaleLand * 0.000005 + 3000) );
		land += 128 * Math.abs( simplex.noise(point.x *scaleLand* 0.000002 + 1000, point.y * scaleLand * 0.000002 + 1000) );
		land += 128 * Math.abs( simplex.noise(point.x *scaleLand* 0.000002 + 2000, point.y * scaleLand * 0.000002 + 2000) );
		land += 128 * Math.abs( simplex.noise(point.x *scaleLand* 0.000002 + 3000, point.y * scaleLand * 0.000002 + 3000) );

		// Lower & Flatten landscape
		land /= 10;
		land = Math.pow(land, 0.80);
		land -= 5;

		mountains *= land / 10;
		land -= 5;
		if (land > 1) land = 1;



		/////
		//
		//			WATER
		//
		/////


		/*
		var water = 0;
		// if (mountains <= 0) {
		var mountainPeak = 500 - mountains;
		// if (mountainPeak > 0) {
			water += 16 *  Math.abs( simplex.noise(point.x * 0.00002, point.y * 0.00002) );
			water += 32 *  Math.abs( simplex.noise(point.x * 0.00001, point.y * 0.00001) );
			water += 64 *  Math.abs( simplex.noise(point.x * 0.000005, point.y * 0.000005) );
			water += 128 *  Math.abs( simplex.noise(point.x * 0.000002, point.y * 0.000002) );
			// water *= -1 * mountainPeak;

			// Restrict Water Beds
			var restriction = 1;
			restriction -= 32 *  Math.abs( simplex.noise(point.x *  0.00005 + 1000, point.y * 0.00005 + 1000) );
			restriction -= 32 *  Math.abs( simplex.noise(point.x *  0.00002 - 1000, point.y * 0.00002 - 1000) );
			restriction -= 64 *  Math.abs( simplex.noise(point.x *  0.00002 + 1000, point.y * 0.00002 + 1000) );
			restriction -= 64 *  Math.abs( simplex.noise(point.x *  0.00002 - 1000, point.y * 0.00002 - 1000) );
			restriction -= 80 *  Math.abs( simplex.noise(point.x * 0.00001 + 1000, point.y * 0.00001 + 1000) );
			restriction /= 100;
			restriction = -1*Math.pow(Math.abs(restriction), 6);
			water *= restriction;
			water /= 10000;
			if (water > 0) water = 0;
			*/
		// }
		
		// return restriction;



		/////
		//
		//			VALLEY
		//
		/////
		
		var valley = Noise.multifractalRidgid( simplex, {x:point.x, y:point.y}, 5, 10 );



		// Sand Dunes
		var dunes = turbulence + Noise.flatten( Noise.multifractalRidgid( simplex, {x:point.x*0.1, y:point.y*0.1}, 5, 9 ), 0.75, -0.2 );
		var duneArea = Math.abs(voronoi.noise(point.x*0.0005, point.y*0.0005).y);
		if (duneArea < 0.5) duneArea = 0.5;
		duneArea -= 0.5;
		duneArea = 1.0 - Math.pow(duneArea, 0.5);

		dunes = dunes * duneArea;

		/*
		// height = 1.0 - Math.sqrt(duneArea);
		if (duneArea >= 0.1 && duneArea < 0.8) {
			var duneSelector = 2 * Math.min(0.5, 1.0 - Math.abs(voronoi.noise(point.x*0.0005, point.y*0.0005).y));
			// var duneSelector2 = 2 * Math.min(0.5, 1.0 - Math.abs(voronoi.noise((point.x+5)*0.0005, (point.y+5)*0.0005).y));
			// duneSelector = duneSelector - duneSelector2;
			// duneSelector *= 40;
			height = dunes * duneSelector;
		}
		duneSelector = Math.pow( duneSelector, 2 );
		duneSelector = Math.min(0.2, duneSelector) * 5;
		dunes *= duneSelector;
		dunes = Noise.flatten( dunes, 1.5, 0 );
		*/


		// height = 1.0 - Math.abs(voronoi.noise(point.x*0.0005, point.y*0.0005).y);
		// if (height > 0.5) height = 0.5;



		/////
		//
		//			HILLS
		//
		/////


		var hills = 0.0*turbulence + Noise.flatten( Noise.multifractalRidgid( simplex, {x:point.x*0.1, y:point.y*0.1}, 2, 10 ), 2, -0.5 );
		hills = Noise.flatten( hills, 0.5, -0.5 );
		if (hills < 0) hills = 0;
		// height *= 2;
		// height *= 1.0 - Math.abs(voronoi.noise(point.x*0.001, point.y*0.001).y);
		// height /= 2;



		// Pebbles ?
		var pebbles = 1.0 - voronoi.noise(point.x*4, point.y*4).x;
		pebbles = Math.min( pebbles, 0.4 );
		pebbles = Noise.flatten( pebbles, 0.08, -0.025 );






		height = mountains + valley + hills + dunes + land;// - pebbles;

		// if (height < 0) height = 0;
		return height;
	};


	var Noise = {

		multifractalRidgid: function(noise, point, startOctave, octaves){

			var height = 0,
				max = 0;
			for (var i=startOctave; i<startOctave+octaves; ++i) {
				var p = Math.pow(2, i);
				max += p;
				height += Math.abs( p*noise.noise( point.x * 1/p, point.y * 1/p ) );
			}
			height /= max;

			return height;

		},

		basicTurbulence: function(noise, point, startOctave, octaves){

			var height = 0,
				max = 0;
			for (var i=startOctave; i<startOctave+octaves; ++i) {
				var p = Math.pow(2, i);
				max += p;
				height += Math.abs( (1/p)*noise.noise( point.x * p, point.y * p ) );
			}
			height /= max;

			return height;

		},

		flatten: function(height, scale, lower){
			return scale*height + lower;
		},

		selector: function(selection, noise1, noise2, edgeFalloff, selectValue){

			selectValue = selectValue || 0;
			if (selection > 0)
				return noise1;
			else
				return noise2;
		},
	};

	var Settings = {
		scaleY_Canvas         : 250.0,
		scaleY_World          : oEvent.data.scaleY_World,
		scaleSteepness_Canvas : 50*256,
		scaleSteepness_World  : oEvent.data.scaleSteepness_World,

		scaleNormal_Canvas    : 1 * 250,
		scaleNormal_World     : oEvent.data.scaleNormal_World,

		canvas_ShowHeight     : true,
		canvas_ShowSlope      : false,
		canvas_ShowNormal     : false
	};

	var NORTH = 1<<0,
		EAST  = 1<<1,
		SOUTH = 1<<2,
		WEST  = 1<<3;
	var LOD_Buffer = function(bufferSize, isL0){
		this.elementsBuffer = new ArrayBuffer(bufferSize);
		this.elements = new Uint16Array(this.elementsBuffer);
		this.ei = 0;

		this.isL0 = isL0 || false;
	};

	// WARNING: lodSections MUST be divisible by the number of sections
	var LOD_Space = function(lodSections){
		this.lodSections = lodSections;

		this.elements = {

			inner: new LOD_Buffer(2*(Math.pow(sections/lodSections - 2, 2) * 2 * 3)),
			top:    new LOD_Buffer(2*(sections/lodSections - 1) * 2 * 3),
			left:   new LOD_Buffer(2*(sections/lodSections - 1) * 2 * 3),
			right:  new LOD_Buffer(2*(sections/lodSections - 1) * 2 * 3),
			bottom: new LOD_Buffer(2*(sections/lodSections - 1) * 2 * 3),

		};

		// Skirts (lod for lower level)
		if (lodSections >= 1) {
			this.elements['top_L0'] =    new LOD_Buffer(2*((sections/lodSections - 2)*3 + 4)*3, NORTH);
			this.elements['left_L0'] =   new LOD_Buffer(2*((sections/lodSections - 2)*3 + 4)*3, WEST);
			this.elements['right_L0'] =  new LOD_Buffer(2*((sections/lodSections - 2)*3 + 4)*3, EAST);
			this.elements['bottom_L0'] = new LOD_Buffer(2*((sections/lodSections - 2)*3 + 4)*3, SOUTH);
		}

	};

	var quadSize = oEvent.data.quadSize,
		quadX = oEvent.data.x,
		quadY = oEvent.data.y,
		lodRange = oEvent.data.lodRange,

		basePower = 2,
		sections = oEvent.data.sections,
		scaleXZ = -1.0*oEvent.data.scaleXZ,
		includeCanvas = oEvent.data.includeCanvas,
		qLen = Math.floor(quadSize/sections);


		LOD_Spaces = [
			new LOD_Space(1),
			new LOD_Space(2),
			new LOD_Space(4),
			new LOD_Space(8),
			// new LOD_Space(16),
			// new LOD_Space(32),
			// new LOD_Space(64),
		];

	/////////////////////
	// Generate Heightmap
	///////////////////////////

	var pointsBuffer    = null,
		slopesBuffer    = null,
		heightmapBuffer = null,
		loadedLOD       = null;
	if (oEvent.data.points && oEvent.data.slopes) {
		pointsBuffer    = oEvent.data.points;
		slopesBuffer    = oEvent.data.slopes;
		heightmapBuffer = oEvent.data.heightmap;
		loadedLOD       = oEvent.data.pointsLOD;
	} else {
		pointsBuffer    = new ArrayBuffer(4*(Math.pow(sections + 1, 2))*3); // xyz position
		slopesBuffer    = new ArrayBuffer(4*(Math.pow(sections + 1, 2))*4); // Normal & Steepness
		if (includeCanvas) heightmapBuffer = new ArrayBuffer(4*(sections+1)*(sections+1));
	}

	var points = new Float32Array(pointsBuffer),
		slopes = new Float32Array(slopesBuffer),
		heightmap = (includeCanvas? new Uint8Array(heightmapBuffer) : null),
		offX = quadX,
		offY = quadY,
		numQuads = 0,
		lastZ = 0,
		numRows = 0,
		numCols = 0,

		i=0,
		ei=0,
		si = 0,
		snm = 1, // Normal/Slope compare offset

		time_Height=0,
		time_Elements=0,

		BUFFER_INNER  = 1<<0,
		BUFFER_TOP    = 1<<1,
		BUFFER_RIGHT  = 1<<2,
		BUFFER_BOTTOM = 1<<3,
		BUFFER_LEFT   = 1<<4;

	var whichBufferSpace = function(point, lodSections){
		// point: starts at (0,0) and ends at (quadSize+1,quadSize+1)
		// lodSections: number of sections in this particular LOD space

		var mask = 0;
		if (point.x < lodSections) {
			mask |= BUFFER_LEFT;
		}
		if (point.y < lodSections) {
			mask |= BUFFER_BOTTOM;
		}
		if (point.x > (sections-lodSections)) {
			mask |= BUFFER_RIGHT;
		}
		if (point.y > (sections-lodSections)) {
			mask |= BUFFER_TOP;
		}
		if (mask === 0) {
			mask |= BUFFER_INNER;
		}
		return mask;
	},

	describeBufferSpace = function(mask){
		var str = "(";
		if (mask & BUFFER_INNER) str += "INNER | ";
		if (mask & BUFFER_TOP) str += "TOP | ";
		if (mask & BUFFER_RIGHT) str += "RIGHT | ";
		if (mask & BUFFER_LEFT) str += "LEFT | ";
		if (mask & BUFFER_BOTTOM) str += "BOTTOM | ";
		str += ")";
		return str;
	};










	lodRange.max = Math.min( LOD_Spaces.length-1, lodRange.max );
	var previouslyLoadedPointsCount = 0,
		numErrors = 0;
	for (var y=quadY, yOff=0, yi=0; yi<=sections; y+=qLen, yOff+=qLen){//++y, ++yOff) {
		for (var x=quadX, xOff=0, xi=-1; xi<=sections; x+=qLen, xOff+=qLen){//++x, ++xOff) {

			if (xOff % qLen == 0) ++xi;

			if ((xOff % qLen == 0) &&
				(yOff % qLen == 0) &&
				xi <= sections && yi <= sections) {

				var height = null;
				if (false && loadedLOD !== null && // FIXME
					xi % LOD_Spaces[loadedLOD].lodSections == 0 &&
					yi % LOD_Spaces[loadedLOD].lodSections == 0) {

					++previouslyLoadedPointsCount;
					if (points[i+1] == 0) ++numErrors;

				} else if (
					(xi % LOD_Spaces[lodRange.min].lodSections == 0 &&
					 yi % LOD_Spaces[lodRange.min].lodSections == 0)    // LOD part

						 ||

					(xi == 0 || yi == 0 || xi == sections || yi == sections )  // Edge (L0)
				
				) {

					var time = (new Date()).getTime();

					
					height = getHeightAt({x: x, y: y});

					if (includeCanvas) {
						heightmap[ ((sections-xi) + (sections-yi) * (sections+1))*4 + 3 ] = 255.0;
					}

					if (includeCanvas && Settings.canvas_ShowHeight) {
						var heightCanvas = height * Settings.scaleY_Canvas;
						if (heightCanvas > 255) heightCanvas = 255;
						heightmap[ ((sections-xi) + (sections-yi) * (sections+1))*4 + 0 ] = heightCanvas;
					}

					points[i+0] = x*scaleXZ;
					points[i+1] = height * Settings.scaleY_World;
					points[i+2] = y*scaleXZ;

					// normals, slopes; IF left & down neighbours, use them for calculating; otherwise find previous heights
					var leftHeight   = 0.0,
						bottomHeight = 0.0;
					if (xi < snm ||
					    ((xi-snm) % Math.min(LOD_Spaces[lodRange.min].lodSections, (loadedLOD!==null? LOD_Spaces[loadedLOD].lodSections : LOD_Spaces[lodRange.min].lodSections)) != 0) ) {
						leftHeight = getHeightAt({x: x-snm*qLen, y: y});
					} else {
						leftHeight = points[3*(yi*(sections+1) + (xi-snm)) + 1] / Settings.scaleY_World;
					}

					if (yi < snm ||
					    ((yi-snm) % Math.min(LOD_Spaces[lodRange.min].lodSections, (loadedLOD!==null? LOD_Spaces[loadedLOD].lodSections : LOD_Spaces[lodRange.min].lodSections)) != 0) ) {
						bottomHeight = getHeightAt({x: x, y: y-snm*qLen});
					} else {
						bottomHeight = points[3*((yi-snm)*(sections+1) + xi) + 1] / Settings.scaleY_World;
					}

					var steepness = 0.0,
						// normalLen = (snm*snm + (height-leftHeight)*(height-leftHeight)) *
						// 			(snm*snm + (height-bottomHeight)*(height-bottomHeight));
						// normal = {x: -snm*(snm*snm)*(height-leftHeight)/normalLen, y: -snm*(snm*snm)*(height-bottomHeight)/normalLen, z: (snm*snm)/normalLen};
						// normal = {x: -snm*(height-leftHeight)/normalLen, y: -(snm*snm)/normalLen, z: -snm*(height-bottomHeight)/normalLen};
						s = snm/100;
						Lx = -s,   Ly = (height-leftHeight),   Lz = 0,
						Bx = 0,    By = (height-bottomHeight), Bz = -s,
						Llen = Math.sqrt(Lx*Lx + Ly*Ly + Lz*Lz),
						Blen = Math.sqrt(Bx*Bx + By*By + Bz*Bz);
					Lx /= Llen; Ly /= Llen; Lz /= Llen;
					Bx /= Blen; By /= Blen; Bz /= Blen;

					var nX = Bz*Ly - Lz*By,
						nY = -(Lx*Bz - Lz*Bx),
						nZ = Lx*By - Ly*Bz;
					var normal = {x: nX, y: nY, z: nZ };


					steepness = Math.max( Math.abs(height - leftHeight), Math.abs(height - bottomHeight) );
					if (includeCanvas && Settings.canvas_ShowSlope) {
						var steepCanvas = steepness * Settings.scaleSteepness_Canvas;
						if (steepCanvas > 255) steepCanvas = 255;
						heightmap[ ((sections-xi) + (sections-yi) * (sections+1))*4 + 1 ] = steepCanvas;
					}

					// var normalness = 2.5 * normalLen / (snm*snm); //Math.sqrt(normal.x*normal.x + normal.y*normal.y + normal.z*normal.z);
					// var normalness = 50 * 250 * Math.sqrt(normal.x*normal.x + normal.y*normal.y);
					if (includeCanvas && Settings.canvas_ShowNormal) {
						var normalCanvas = (normal.y * normal.x + 1.0) / 2.0 * Settings.scaleNormal_Canvas;
						if (normalCanvas < 0)   normalCanvas = 0;
						if (normalCanvas > 255) normalCanvas = 255;
						heightmap[ ((sections-xi) + (sections-yi) * (sections+1))*4 + 2 ] = normalCanvas;
					}

					slopes[si+0] = Math.abs(normal.x) * Settings.scaleNormal_World;
					slopes[si+1] = Math.abs(normal.y) * Settings.scaleNormal_World;
					slopes[si+2] = Math.abs(normal.z) * Settings.scaleNormal_World;
					slopes[si+3] = steepness* Settings.scaleSteepness_World;

					var timeEnd = (new Date()).getTime();
					time_Height += (timeEnd - time);

				}


				if (xOff !== 0 && yOff !== 0) {

					var time = (new Date()).getTime();

					for (var lSpacei=lodRange.min; lSpacei<=lodRange.max; ++lSpacei) {
						var lSpace  = LOD_Spaces[lSpacei];

						if (xi >= lSpace.lodSections && yi >= lSpace.lodSections &&
							(xi % lSpace.lodSections == 0) && (yi % lSpace.lodSections == 0)) {
							var pBSpace_q4 = whichBufferSpace({y:yi, x:xi}, lSpace.lodSections),
								pBSpace_q1 = whichBufferSpace({y:yi-lSpace.lodSections, x:xi-lSpace.lodSections}, lSpace.lodSections),

								// NOTE: parametric point (x,y) is given at index:
								// 			(y-1)*3n + x*3 + (0,1,2)
								// 		  = 3((y-1) + x) + (0,1,2)
								//
								// 		 	n is the number of sections
								L = lSpace.lodSections,
								n = sections+1,
								i4 = (yi*n + xi),
								i3 = (yi*n + (xi-L)),
								i2 = ((yi-L)*n + xi),
								i1 = ((yi-L)*n + (xi-L)),

								in_L0  = null,
								ie_L0  = null,
								is_L0  = null,
								iw_L0  = null;

								
								if (L>=basePower) {
									var L0 = L/basePower;

									in_L0 = (yi*n + (xi-L0));
									ie_L0 = ((yi-L0)*n + xi);
									is_L0 = ((yi-L)*n + (xi-L0));
									iw_L0 = ((yi-L0)*n + (xi-L));
								}

							if (i4 !== (i3+1*L) ||
								i2 !== (i1+1*L) ||
								i4 !== (i/3)) {
								console.error("Error finding coordinates!");
							}



								var isCorner = false,
									bufferSpace = null;

								if (pBSpace_q4 === BUFFER_INNER &&
									pBSpace_q1 === BUFFER_INNER) {

									bufferSpace = {
										L1: lSpace.elements.inner
									};

								} else if (pBSpace_q4 === BUFFER_TOP &&
										   pBSpace_q1 === BUFFER_TOP) {

									bufferSpace = {
										L1: lSpace.elements.top,
										L0: lSpace.elements.top_L0
									};


								} else if (pBSpace_q4 === BUFFER_BOTTOM &&
										   pBSpace_q1 === BUFFER_BOTTOM) {

									bufferSpace = {
										L1: lSpace.elements.bottom,
										L0: lSpace.elements.bottom_L0
									};

								} else if (pBSpace_q4 === BUFFER_LEFT &&
										   pBSpace_q1 === BUFFER_LEFT) {

									bufferSpace = {
										L1: lSpace.elements.left,
										L0: lSpace.elements.left_L0
									};

								} else if (pBSpace_q4 === BUFFER_RIGHT &&
										   pBSpace_q1 === BUFFER_RIGHT) {

									bufferSpace = {
										L1: lSpace.elements.right,
										L0: lSpace.elements.right_L0
									};

								} else if (pBSpace_q4 === (BUFFER_TOP|BUFFER_RIGHT) &&
										   pBSpace_q1 === (BUFFER_TOP|BUFFER_RIGHT)) {

									isCorner = true;
									bufferSpace = {
										nw: {
											L1: lSpace.elements.top,
											L0: lSpace.elements.top_L0
										},
										se: {
											L1: lSpace.elements.right,
											L0: lSpace.elements.right_L0
										},
									};

								} else if ((pBSpace_q4 === BUFFER_INNER) &&
										   (pBSpace_q1 === (BUFFER_LEFT | BUFFER_BOTTOM))) {

										isCorner = true;
										bufferSpace = {
											nw: {
												L1: lSpace.elements.left,
												L0: lSpace.elements.left_L0
											},
											se: {
												L1: lSpace.elements.bottom,
												L0: lSpace.elements.bottom_L0
											},
										};

								} else if ((pBSpace_q4 === BUFFER_INNER) &&
										   (pBSpace_q1 === BUFFER_BOTTOM)) {

										bufferSpace = {
											L1: lSpace.elements.bottom,
											L0: lSpace.elements.bottom_L0
										};

								} else if ((pBSpace_q4 === BUFFER_RIGHT) &&
										   (pBSpace_q1 === BUFFER_BOTTOM)) {

										isCorner = true;
										bufferSpace = {
											sw: {
												L1: lSpace.elements.bottom,
												L0: lSpace.elements.bottom_L0
											},
											ne: {
												L1: lSpace.elements.right,
												L0: lSpace.elements.right_L0
											}
										}

								} else if ((pBSpace_q4 === BUFFER_INNER) &&
										   (pBSpace_q1 === BUFFER_LEFT)) {

										bufferSpace = {
											L1: lSpace.elements.left,
											L0: lSpace.elements.left_L0
										};

								} else if ((pBSpace_q4 === BUFFER_RIGHT) &&
										   (pBSpace_q1 === BUFFER_INNER)) {

										bufferSpace = {
											L1: lSpace.elements.right,
											L0: lSpace.elements.right_L0
										};

								} else if ((pBSpace_q4 === BUFFER_TOP) &&
										   (pBSpace_q1 === BUFFER_INNER)) {

										bufferSpace = {
											L1: lSpace.elements.top,
											L0: lSpace.elements.top_L0
										};

								} else if ((pBSpace_q4 === (BUFFER_TOP | BUFFER_RIGHT)) &&
										   (pBSpace_q1 === BUFFER_INNER)) {

										isCorner = true;
										bufferSpace = {
											se: {
												L1: lSpace.elements.right,
												L0: lSpace.elements.right_L0
											},
											nw: {
												L1: lSpace.elements.top,
												L0: lSpace.elements.top_L0
											}
										}

								} else if ((pBSpace_q4 === BUFFER_TOP) &&
										   (pBSpace_q1 === BUFFER_LEFT)) {

										isCorner = true;
										bufferSpace = {
											sw: {
												L1: lSpace.elements.left,
												L0: lSpace.elements.left_L0
											},
											ne: {
												L1: lSpace.elements.top,
												L0: lSpace.elements.top_L0
											}
										}

								} else if ((pBSpace_q4 === (BUFFER_TOP | BUFFER_RIGHT)) &&
										   (pBSpace_q1 === BUFFER_TOP)) {
									console.error("THIS SHOULD NEVER OCCUR");
									bufferSpace = {
										L1: lSpace.elements.inner // TODO: WRONG,
									};
										
								} else if ((pBSpace_q4 === (BUFFER_TOP | BUFFER_RIGHT)) &&
										   (pBSpace_q1 === BUFFER_RIGHT)) {
									console.error("THIS SHOULD NEVER OCCUR");
									bufferSpace = {
										L1: lSpace.elements.inner // TODO: WRONG,
									};
										

								} else if ((pBSpace_q4 === BUFFER_TOP) &&
										   (pBSpace_q1 === (BUFFER_TOP | BUFFER_LEFT))) {
									console.error("THIS SHOULD NEVER OCCUR");
									bufferSpace = {
										L1: lSpace.elements.inner // TODO: WRONG,
									};
										

								} else if ((pBSpace_q4 === BUFFER_RIGHT) &&
										   (pBSpace_q1 === (BUFFER_RIGHT | BUFFER_BOTTOM))) {
									console.error("THIS SHOULD NEVER OCCUR");
									bufferSpace = {
										L1: lSpace.elements.inner // TODO: WRONG,
									};
										
								} else {

									console.warn("CORNER!? Unsure which buffer space... probably use & mask to pick best candidate");
									// console.log("q4: " + describeBufferSpace(pBSpace_q4));
									// console.log("q1: " + describeBufferSpace(pBSpace_q1));

								}

								if (bufferSpace) {

									if (isCorner) {

										if (bufferSpace.nw) {

											bufferSpace.nw.L1.elements[ bufferSpace.nw.L1.ei+0 ] = i1;
											bufferSpace.nw.L1.elements[ bufferSpace.nw.L1.ei+1 ] = i4;
											bufferSpace.nw.L1.elements[ bufferSpace.nw.L1.ei+2 ] = i3;
											bufferSpace.nw.L1.ei += 3;

											if (bufferSpace.nw.L0) {

												if (bufferSpace.nw.L0.isL0 & NORTH) {

													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+0 ] = i1;
													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+1 ] = i4;
													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+2 ] = in_L0;

													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+3 ] = i1;
													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+4 ] = in_L0;
													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+5 ] = i3;

													bufferSpace.nw.L0.ei += 6;

												} else if (bufferSpace.nw.L0.isL0 & WEST) {

													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+0 ] = i1;
													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+1 ] = i4;
													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+2 ] = iw_L0;

													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+3 ] = iw_L0;
													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+4 ] = i4;
													bufferSpace.nw.L0.elements[ bufferSpace.nw.L0.ei+5 ] = i3;

													bufferSpace.nw.L0.ei += 6;

												}
											}

										}

										if (bufferSpace.ne) {

											bufferSpace.ne.L1.elements[ bufferSpace.ne.L1.ei+0 ] = i2;
											bufferSpace.ne.L1.elements[ bufferSpace.ne.L1.ei+1 ] = i4;
											bufferSpace.ne.L1.elements[ bufferSpace.ne.L1.ei+2 ] = i3;
											bufferSpace.ne.L1.ei += 3;

											if (bufferSpace.ne.L0) {

												if (bufferSpace.ne.L0.isL0 & NORTH) {

													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+0 ] = i2;
													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+1 ] = i4;
													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+2 ] = in_L0;

													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+3 ] = i2;
													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+4 ] = in_L0;
													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+5 ] = i3;

													bufferSpace.ne.L0.ei += 6;

												} else if (bufferSpace.ne.L0.isL0 & EAST) {

													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+0 ] = i2;
													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+1 ] = ie_L0;
													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+2 ] = i3;

													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+3 ] = ie_L0;
													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+4 ] = i4;
													bufferSpace.ne.L0.elements[ bufferSpace.ne.L0.ei+5 ] = i3;

													bufferSpace.ne.L0.ei += 6;

												}
											}

										}

										if (bufferSpace.sw) {

											bufferSpace.sw.L1.elements[ bufferSpace.sw.L1.ei+0 ] = i2;
											bufferSpace.sw.L1.elements[ bufferSpace.sw.L1.ei+1 ] = i3;
											bufferSpace.sw.L1.elements[ bufferSpace.sw.L1.ei+2 ] = i1;
											bufferSpace.sw.L1.ei += 3;

											if (bufferSpace.sw.L0) {

												if (bufferSpace.sw.L0.isL0 & SOUTH) {

													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+0 ] = i2;
													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+1 ] = i3;
													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+2 ] = is_L0;

													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+3 ] = is_L0;
													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+4 ] = i3;
													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+5 ] = i1;

													bufferSpace.sw.L0.ei += 6;

												} else if (bufferSpace.sw.L0.isL0 & WEST) {

													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+0 ] = i2;
													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+1 ] = iw_L0;
													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+2 ] = i1;

													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+3 ] = i2;
													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+4 ] = i3;
													bufferSpace.sw.L0.elements[ bufferSpace.sw.L0.ei+5 ] = iw_L0;

													bufferSpace.sw.L0.ei += 6;

												}
											}


										}

										if (bufferSpace.se) {

											bufferSpace.se.L1.elements[ bufferSpace.se.L1.ei+0 ] = i1;
											bufferSpace.se.L1.elements[ bufferSpace.se.L1.ei+1 ] = i2;
											bufferSpace.se.L1.elements[ bufferSpace.se.L1.ei+2 ] = i4;
											bufferSpace.se.L1.ei += 3;

											if (bufferSpace.se.L0) {

												if (bufferSpace.se.L0.isL0 & SOUTH) {

													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+0 ] = i1;
													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+1 ] = is_L0;
													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+2 ] = i4;

													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+3 ] = is_L0;
													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+4 ] = i2;
													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+5 ] = i4;

													bufferSpace.se.L0.ei += 6;

												} else if (bufferSpace.se.L0.isL0 & EAST) {

													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+0 ] = i1;
													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+1 ] = ie_L0;
													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+2 ] = i4;

													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+3 ] = i1;
													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+4 ] = i2;
													bufferSpace.se.L0.elements[ bufferSpace.se.L0.ei+5 ] = ie_L0;

													bufferSpace.se.L0.ei += 6;

												}
											}


										}

									} else {


										bufferSpace.L1.elements[ bufferSpace.L1.ei+0 ] = i1;
										bufferSpace.L1.elements[ bufferSpace.L1.ei+1 ] = i2;
										bufferSpace.L1.elements[ bufferSpace.L1.ei+2 ] = i3;

										bufferSpace.L1.elements[ bufferSpace.L1.ei+3 ] = i2;
										bufferSpace.L1.elements[ bufferSpace.L1.ei+4 ] = i4;
										bufferSpace.L1.elements[ bufferSpace.L1.ei+5 ] = i3;

										bufferSpace.L1.ei += 6;

										if (bufferSpace.L0) {

											if (bufferSpace.L0.isL0 & NORTH) {

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+0 ] = i4;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+1 ] = in_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+2 ] = i2;

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+3 ] = in_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+4 ] = i1;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+5 ] = i2;

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+6 ] = in_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+7 ] = i3;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+8 ] = i1;

											   bufferSpace.L0.ei += 9;

											} else if (bufferSpace.L0.isL0 & EAST) {

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+0 ] = i3;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+1 ] = ie_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+2 ] = i4;

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+3 ] = ie_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+4 ] = i3;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+5 ] = i1;

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+6 ] = ie_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+7 ] = i1;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+8 ] = i2;

											   bufferSpace.L0.ei += 9;

											} else if (bufferSpace.L0.isL0 & SOUTH) {

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+0 ] = i4;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+1 ] = is_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+2 ] = i2;

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+3 ] = is_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+4 ] = i4;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+5 ] = i3;

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+6 ] = is_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+7 ] = i3;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+8 ] = i1;

											   bufferSpace.L0.ei += 9;

											} else if (bufferSpace.L0.isL0 & WEST) {

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+0 ] = i4;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+1 ] = iw_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+2 ] = i2;

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+3 ] = iw_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+4 ] = i1;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+5 ] = i2;

											   bufferSpace.L0.elements[ bufferSpace.L0.ei+6 ] = iw_L0;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+7 ] = i4;
											   bufferSpace.L0.elements[ bufferSpace.L0.ei+8 ] = i3;

											   bufferSpace.L0.ei += 9;

											}

										}

									}
								} else {
									console.error('Unsure which buffer space this element is in!?');
								}

						}

					}

					var timeEnd = (new Date()).getTime();
					time_Elements += (timeEnd - time);
				}



				i+=3;
				si+=4;
			}
		}

		if (yOff % qLen == 0) {
			++yi;
		}
	}




	var data = {
		"hash": oEvent.data.hash,
		"points": pointsBuffer,
		"slopes": slopesBuffer,
		"elements": [],
	};
	
	var elements = [],
		transferObjects = [data.points, data.slopes];

	if (includeCanvas) {
		data.heightmap = heightmapBuffer;
		transferObjects.push( data.heightmap );
	}

	for (var lSpacei=lodRange.min; lSpacei<=lodRange.max; ++lSpacei) {
		var lSpace = LOD_Spaces[lSpacei],
			lSpace_Obj = {
				lodSections: lSpace.lodSections,
				lodLevel: lSpacei
			};

		for (var lSpace_Li in lSpace.elements) {
			lSpace_Obj[ lSpace_Li ] = lSpace.elements[lSpace_Li].elementsBuffer;
			transferObjects.push( lSpace_Obj[ lSpace_Li ] );
		}
		data.elements.push( lSpace_Obj );
	}
	

	postMessage(data, transferObjects);
	self.close();
}





























var Voronoi = function(seed){

	this.noise = function(x,y){

		// JB: massive issues with using negative coordinates
		x = Math.abs(x);
		y = Math.abs(y);

		var K = 0.142857142857, // 1/7
			Ko = 0.428571428571, // 3/7
			jitter = 1.0, // Less gives more regular pattern
			magic = seed;

		var permute = function(x) {
			return {
				x: ((34*x.x + 1.0) * x.x) % magic,
				y: ((34*x.y + 1.0) * x.y) % magic,
				z: ((34*x.z + 1.0) * x.z) % magic };
		};

		var fract = function(x) {
			if (x==0) return 0;
			var sign = Math.abs(x)/x;
			return sign * (Math.abs(x) - Math.floor(Math.abs(x)));
		};

		var Pi = { x: Math.floor(x) % magic,
				   y: Math.floor(y) % magic },
			Pf = { x: fract(x),
				   y: fract(y) },
			oi = { x: -1.0, y: 0.0, z: 1.0 },
			of = { x: -0.5, y: 0.5, z: 1.5 },
			px = permute({ x: oi.x + Pi.x, y: oi.y + Pi.x, z: oi.z + Pi.x }),
			p  = permute({ x: px.x + Pi.y + oi.x, y: px.x + Pi.y + oi.y, z: px.x + Pi.y + oi.z }),
			ox = { x: fract(p.x*K) - Ko,
				   y: fract(p.y*K) - Ko,
				   z: fract(p.z*K) - Ko },
			oy = {  x: (Math.floor(p.x*K) % 7)*K - Ko,
					y: (Math.floor(p.y*K) % 7)*K - Ko,
					z: (Math.floor(p.z*K) % 7)*K - Ko },
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
			ox = {  x: fract(p.x*K) - Ko,
					y: fract(p.y*K) - Ko,
					z: fract(p.z*K) - Ko };
			oy = {  x: (Math.floor(p.x*K) % 7)*K - Ko,
					y: (Math.floor(p.y*K) % 7)*K - Ko,
					z: (Math.floor(p.z*K) % 7)*K - Ko };
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
			ox = {  x: fract(p.x*K) - Ko,
					y: fract(p.y*K) - Ko,
					z: fract(p.z*K) - Ko };
			oy = {  x: (Math.floor(p.x*K) % 7)*K - Ko,
					y: (Math.floor(p.y*K) % 7)*K - Ko,
					z: (Math.floor(p.z*K) % 7)*K - Ko };
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

};


var Simplex = function(seed){

	this.magic = seed;

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

	this.noise = function(x, y)
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
