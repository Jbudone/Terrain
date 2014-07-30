
# Terrain Generator

An infinite terrain generator built on JS and WebGL, and using webworkers for offloading chunk generation.

# How it Works

The overall terrain is composed of a network of quads (chunks); each of which is a heightmap which is generated in
generatorWorker.js. The world (terrain) has a list of quads which are currently visible, and a load queue of
those quads which still need to be generated. The load queue is periodically checked (generator.js), and the
quad which is closest to the user is sent off through a webworker to be generated. The generator creates the
quad's heightmap, normal map, slopes, and the elements for each requested LOD; then sends it back to
generator.js through transferable objects and places it on the quad buffer queue (viewport.js). To minimize
any pauses in the framerate, the quads which need to be buffered (sent to the GPU) are handled after the scene
is drawn. To avoid memory concerns, all of the quad data (heights/normals/slopes/elements) are deleted
immediately after they're sent to the GPU; I've timed the garbage collector with this to find the optimal wait
time between generating new quads and the number of webworkers (on Chrome/Linux --  Settings -> Tools -> Task
		Manager   to confirm my timing); if this timing is off and we load too much data from the quads before
previous deleted data is collected, then the browser simply crashes (white screen).

- Play around with the settings in main.js
- Tweak the texture synthesis in index.html, under `<script id="shader-fs" type="x-shader/x-fragment">`
- Toy with the heightmap generation in generatorWorker.js

# Pretty Pictures

![screenie](/screenshots/screen1.png)
![screenie](/screenshots/screen2.png)
![screenie](/screenshots/screen3.png)
![screenie](/screenshots/screen4.png)
![screenie](/screenshots/screen5.png)
![screenie](/screenshots/screen6.png)
![screenie](/screenshots/screen7.png)
![screenie](/screenshots/screen8.png)
![screenie](/screenshots/screen9.png)
![screenie](/screenshots/screen10.png)
![screenie](/screenshots/screen11.png)
