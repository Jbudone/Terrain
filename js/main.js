
	var Settings = {
			framerate            : 45,
			fov                  : 65,
			nearPlane            : 1,
			farPlane             : 400000.0,
			canvasWidth          : null,
			canvasHeight         : null,
			aspectRatio          : null,

			scaleXZ              : 1.0,
			quadTiles            : 248, // NOTE: must divide into the quad, and divide each LOD
			scaleY_World         : 1500.0,
			scaleSteepness_World : 50*256,
			scaleNormal_World    : 2.0,
			useLOD               : true,
			verticalSkirtLength  : 2.0,
			quadSize             : 6200,//12400,//24800,//6200,
			viewRadius           : 100000,//30000,//20000,// 60000,
			maxWorkers           : 4,
			includeCanvas        : false, // draw heightmap canvas? NOTE: HUGELY INEFFICIENT!
										// WARNING: MAKE SURE TO MAKE VIEW RADIUS VERY SMALL FOR CANVAS!!!  (~10000)

			seed1                : 280,
			seed2                : 289
	},  Objects = {
			camera : { position : new THREE.Vector3(0,0,0), },
			quads  : { },
	}, Quad_LODs = {
		6200: [248, 200, 124, 100],
		12400: [248, 200, 124, 100],
		24800: [248, 200, 160, 124]
	}, LOD_Spaces = {
		// Each LOD may have a dynamic number of tiles for the quad
		// 	- tiles MUST divide into the quad size
		// 	- tiles MUST be less than 256 (ushort)
		// 	- tiles MUST divide the LOD level
		//
		// The end number of tiles in the quad is (tiles / 2^LOD)
		0: {
			distance: Math.pow(0*Settings.quadSize,2),
			tiles: Quad_LODs[Settings.quadSize][0], },
		1: {
			distance: Math.pow(2*Settings.quadSize,2),
			tiles: Quad_LODs[Settings.quadSize][0], },
		2: {
			distance: Math.pow(4*Settings.quadSize,2),
			tiles: Quad_LODs[Settings.quadSize][0], },
		3: {
			distance: Math.pow(12*Settings.quadSize,2),
			tiles: Quad_LODs[Settings.quadSize][0] },
	};
	if (Settings.quadSize != 6200) {
		LOD_Spaces[4] = {
			distance: Math.pow(16*Settings.quadSize,2),
			tiles: Quad_LODs[Settings.quadSize][2], };
		LOD_Spaces[5] = {
			distance: Math.pow(18*Settings.quadSize,2),
			tiles: Quad_LODs[Settings.quadSize][2], };
	}



	$(document).ready(function(){
		generateImage();
		initViewport();
		drawScene();


		window['world'] = world;



		if (Settings.includeCanvas) {
			$('#heightmap').css('display', 'block');
		}


		var MOVE_FORWARD  = 1<<0,
			MOVE_BACKWARD = 1<<1,
			MOVE_LEFT     = 1<<2,
			MOVE_RIGHT    = 1<<3,
			MOVE_UP       = 1<<4,
			MOVE_DOWN     = 1<<5,
			MOVE_RUNNING  = 1<<6;
		var UI = {
			viewport: {
				mouse: {
					position: {x:0,y:0},
					buttons: 0,
					target: new THREE.Vector3(0,0,0),
					phi: 0.0,
				},
				move: new THREE.Vector3(0,0,0),
				isMoving: 0
			},
			mouse: {
				isDown: false,
				position: {x:0, y:0}
			},
			lastWorldUpdate: (new Date()).getTime(),
		}

		var updateMove = function(){
			if (UI.viewport.isMoving) {

				// Which way are we moving?
				var move = UI.viewport.move,
					movement = UI.viewport.isMoving;
				move.x = 0; move.y = 0; move.z = 0;
				if ( movement & MOVE_FORWARD )  move.z += 1;
				if ( movement & MOVE_BACKWARD ) move.z -= 1;
				if ( movement & MOVE_LEFT )     move.x -= 1;
				if ( movement & MOVE_RIGHT )    move.x += 1;
				if ( movement & MOVE_UP )       move.y -= 1;
				if ( movement & MOVE_DOWN )     move.y += 1;

				// What direction are we looking?
				var qX = new THREE.Quaternion(),
					qY = new THREE.Quaternion(),
					qZ = new THREE.Quaternion(),
					m = new THREE.Matrix4();
				qX.setFromAxisAngle( new THREE.Vector3(0,1,0), -Objects.camera.phi );
				qY.setFromAxisAngle( new THREE.Vector3(-1,0,0),-Objects.camera.theta );
				qZ.setFromAxisAngle( new THREE.Vector3(0,0,1), Objects.camera.lambda );
				qY.multiply(qX);
				qY.multiply(qZ);
				m.makeRotationFromQuaternion(qY);
				m.getInverse(m);
				move.applyMatrix4(m);

				// Are we running?
				move.x *= -1;
				if ( movement & MOVE_RUNNING ) move.multiplyScalar(1000);
				else move.multiplyScalar(100);

				// Apply the movement
				Objects.camera.position.add(move);
				updateCamera();
				position.y = Objects.camera.position.z/Settings.scaleXZ;
				position.x = Objects.camera.position.x/Settings.scaleXZ;

				// Update the world if necessary
				var time = (new Date()).getTime();
				if (time - UI.lastWorldUpdate > 400) {
					UI.lastWorldUpdate = time;
					world.update();
				}
				if (Settings.includeCanvas) {
					updateCanvas();
				}

			}

			setTimeout(updateMove, 50);
		};

		updateMove();

		if (Settings.includeCanvas) {
			canvas.addEventListener('mousedown', function MouseDownEvent(evt){
				var bounds  = canvas.getBoundingClientRect(),
					mouseY  = evt.clientY - bounds.top,
					mouseX  = evt.clientX - bounds.left;

				UI.mouse.isDown = true;
				UI.mouse.position.x = mouseX;
				UI.mouse.position.y = mouseY;
			});

			canvas.addEventListener('mouseup', function MouseUpEvent(evt){
				UI.mouse.isDown = false;
			});

			canvas.addEventListener('mousemove', function MouseMoveEvent(evt){
				if (UI.mouse.isDown) {
					var bounds  = canvas.getBoundingClientRect(),
						mouseY  = evt.clientY - bounds.top,
						mouseX  = evt.clientX - bounds.left,
						deltaY  = 10*1.7*2*(mouseY - UI.mouse.position.y),
						deltaX  = 10*1.7*(mouseX - UI.mouse.position.x);

					position.y += deltaY;
					position.x += deltaX;

					Objects.camera.position.x = Settings.scaleXZ*position.x;
					Objects.camera.position.z = Settings.scaleXZ*position.y;


					// Hover above the ground if necessary (don't clip through the terrain)
					var insideQuad = null;
					for (var hash in world.quadCache) {
						var quad = world.quadCache[hash];
						if (quad.x <= position.x && quad.y <= position.y && (quad.x + world.quadSize) >= position.x && (quad.y + world.quadSize) >= position.y) {
							insideQuad = quad;
							break;
						}
					}

					if (insideQuad && insideQuad.heightmap) {
						var floorHeight = insideQuad.heightmap.data[ ((Settings.quadTiles - Math.floor((position.x - quad.x)/(Settings.quadSize / (Settings.quadTiles+0)))) + (Settings.quadTiles - Math.floor((position.y - quad.y)/(Settings.quadSize / (Settings.quadTiles+0)))) * (Settings.quadTiles+1))*4 + 0 ] / 10.0 * Settings.scaleY_World,
							hover = 1000;

						// console.log("Positioning: pos{"+position.x+", "+position.y+"} quad{"+quad.x+", "+quad.y+"}; canvas{"+(Math.floor((position.x - quad.x)/(Settings.quadSize / (Settings.quadTiles+1))))+", "+(Math.floor((position.y - quad.y)/(Settings.quadSize / (Settings.quadTiles+1))))+"} --- "+floorHeight);

						// if (Objects.camera.position.y > (floorHeight * -1 - hover)) {
							Objects.camera.position.y = (-1*floorHeight) - hover;
						// }
					}



					updateCamera();

					UI.mouse.position.x = mouseX;
					UI.mouse.position.y = mouseY;

					var time = (new Date()).getTime();
					if (time - UI.lastWorldUpdate > 400) {
						UI.lastWorldUpdate = time;
						world.update();
					}

					updateCanvas();
				}
			});
		}

		viewportCanvas.addEventListener('mousedown', function MouseDownEvent(evt){

			var bounds  = viewportCanvas.getBoundingClientRect(),
				mouseY  = evt.clientY - bounds.top,
				mouseX  = evt.clientX - bounds.left;

			UI.viewport.mouse.position.x = mouseX;
			UI.viewport.mouse.position.y = mouseY;

			var MOUSE_LOOK = 4,
				MOUSE_MOVE = 1 | MOUSE_LOOK;
			UI.viewport.mouse.buttons |= (1<<evt.button);
			if ((UI.viewport.mouse.buttons & MOUSE_MOVE) === MOUSE_MOVE) {
				UI.viewport.isMoving |= MOVE_FORWARD;
			} else if ((UI.viewport.mouse.buttons & MOUSE_LOOK) === MOUSE_LOOK) {

			}

			evt.preventDefault();
			return false;

		});
		viewportCanvas.oncontextmenu = function(){ return false; };

		viewportCanvas.addEventListener('mouseup', function MouseUpEvent(evt){

			var MOUSE_LOOK = 4,
				MOUSE_MOVE = 1 | MOUSE_LOOK;
			UI.viewport.mouse.buttons = UI.viewport.mouse.buttons & ~(1<<evt.button);
			if ((UI.viewport.mouse.buttons & MOUSE_MOVE) !== MOUSE_MOVE) {
				UI.viewport.isMoving &= ~MOVE_FORWARD;
			}

			evt.preventDefault();
			return false;

		});

		viewportCanvas.addEventListener('mousemove', function MouseMoveEvent(evt){

			var MOUSE_LOOK = 4;
			if (UI.viewport.mouse.buttons & MOUSE_LOOK) {

				var bounds  = viewportCanvas.getBoundingClientRect(),
					mouseY  = evt.clientY - bounds.top,
					mouseX  = evt.clientX - bounds.left,
					deltaY  = 1.7*2*(mouseY - UI.viewport.mouse.position.y),
					deltaX  = 1.7*(mouseX -   UI.viewport.mouse.position.x);



					Objects.camera.phi += deltaX*0.001;
					Objects.camera.phi = Objects.camera.phi % (Math.PI*2.0);

					Objects.camera.theta += deltaY*0.0005;
					if (Objects.camera.theta > Math.PI) Objects.camera.theta = Math.PI;
					if (Objects.camera.theta < -Math.PI)Objects.camera.theta = -Math.PI;

					updateCamera();


				UI.viewport.mouse.position.x = mouseX;
				UI.viewport.mouse.position.y = mouseY;
			}

		});

		document.addEventListener('keydown', function KeyDownEvent(evt){
			
				   if (evt.keyCode === 87) {
				UI.viewport.isMoving |= MOVE_BACKWARD;
			} else if (evt.keyCode === 65) {
				UI.viewport.isMoving |= MOVE_LEFT;
			} else if (evt.keyCode === 68) {
				UI.viewport.isMoving |= MOVE_RIGHT;
			} else if (evt.keyCode === 83) {
				UI.viewport.isMoving |= MOVE_UP;
			} else if (evt.keyCode === 16) {
				UI.viewport.isMoving |= MOVE_RUNNING;
			}
		});

		document.addEventListener('keyup', function KeyUpEvent(evt){
			
				   if (evt.keyCode === 87) {
				UI.viewport.isMoving &= ~MOVE_BACKWARD;
			} else if (evt.keyCode === 65) {
				UI.viewport.isMoving &= ~MOVE_LEFT;
			} else if (evt.keyCode === 68) {
				UI.viewport.isMoving &= ~MOVE_RIGHT;
			} else if (evt.keyCode === 83) {
				UI.viewport.isMoving &= ~MOVE_UP;
			} else if (evt.keyCode === 16) {
				UI.viewport.isMoving &= ~MOVE_RUNNING;
			}
		});

	});
