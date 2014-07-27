
	var Settings = {
			framerate    : 45,
			fov          : 75,
			nearPlane    : 1,
			farPlane     : 300000.0,
			canvasWidth  : null,
			canvasHeight : null,
			aspectRatio  : null,
			scaleXZ      : 1.0,
			useLOD       : true
			quadSize     : 6200,
			viewRadius   : 20000,// 60000,
	},  Objects = {
			camera : { position : new THREE.Vector3(0,0,0), },
			quads  : { },
	}, LOD_Spaces = {
		0: Math.pow(6200,2),
		1: Math.pow(2*6200,2),
		2: Math.pow(3*6200,2),
		3: Math.pow(4*6200,2),
		// 4: Math.pow(9000,2),
		// 5: Math.pow(12000,2),
	};



	$(document).ready(function(){
		generateImage();
		initViewport();
		drawScene();

		window['world'] = world;


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

			}

			setTimeout(updateMove, 50);
		};

		updateMove();

		/* TODO: re-enable canvas for heightmap visualization
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
					deltaY  = 1.7*2*(mouseY - UI.mouse.position.y),
					deltaX  = 1.7*(mouseX - UI.mouse.position.x);

				position.y += deltaY;
				position.x += deltaX;

				Objects.camera.position.x = Settings.scaleXZ*position.x;
				Objects.camera.position.z = Settings.scaleXZ*position.y;
				updateCamera();

				UI.mouse.position.x = mouseX;
				UI.mouse.position.y = mouseY;

				var time = (new Date()).getTime();
				if (time - UI.lastWorldUpdate > 400) {
					UI.lastWorldUpdate = time;
					world.update();
				}
			}
		});
		*/

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
