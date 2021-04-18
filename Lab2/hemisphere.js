/*
 * hemisphere.js
 * Demonstrate hemisphere based ambient lighting.
 *
 *  - simplify code to use only hemisphere 
 *    instead of both hemisphere and Lambertian shading
 */


//----------------------------------------------------------------------------
// Variable Setup
//----------------------------------------------------------------------------

// This variable will store the WebGL rendering context
var gl;
var batman;

var red = 		 [1.0, 0.0, 0.0, 1.0];
var green = 	 [0.0, 1.0, 0.0, 1.0];
var blue = 		 [0.0, 0.0, 1.0, 1.0];
var lightred =   [1.0, 0.5, 0.5, 1.0];
var lightgreen = [0.5, 1.0, 0.5, 1.0];
var lightblue =  [0.5, 0.5, 1.0, 1.0];
var white = 	 [1.0, 1.0, 1.0, 1.0];
var black =      [0.0, 0.0, 0.0, 1.0];



//Variables for Transformation Matrices
var mv = new mat4();
var p  = new mat4();
var mvLoc, projLoc;

//Variables for Lighting
var global;
var material;
var lighting;
var uColor;

//You will need to rebind these buffers
//and point attributes at them after calling uofrGraphics draw functions
var vertexBuffer, normalBuffer;
var program;


function bindBuffersToShader()
{
	if(batman.loaded)
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, batman.vertexObject);
		gl.vertexAttribPointer( program.vPosition, 3, gl.FLOAT, gl.FALSE, 0, 0 );
		gl.enableVertexAttribArray( program.vPosition );

		gl.bindBuffer(gl.ARRAY_BUFFER, batman.normalObject);
		gl.vertexAttribPointer( program.vNormal, 3, gl.FLOAT, gl.FALSE, 0, 0 );
		gl.enableVertexAttribArray( program.vNormal );

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, batman.indexObject);
	}
}


//----------------------------------------------------------------------------
// Initialization Event Function
//----------------------------------------------------------------------------

window.onload = function init()
{
	// Set up a WebGL Rendering Context in an HTML5 Canvas
	var canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl)
	{
		alert("WebGL isn't available");
	}

	//  Configure WebGL
	//  eg. - set a clear color
	//      - turn on depth testing
	gl.clearColor(0.0,0.0,0.0,0);
	gl.enable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);

	//  Load shaders and initialize attribute buffers
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// Set up data to draw
	// All handled by j3di.js and uofrGraphics in this program

	// Learn shader attribute locations
	//***Vertices***
	program.vPosition = gl.getAttribLocation(program, "vPosition");
	gl.enableVertexAttribArray( program.vPosition );

	//***Normals***
	program.vNormal = gl.getAttribLocation(program, "vNormal");
	gl.enableVertexAttribArray( program.vNormal );

	// Get addresses of transformation uniforms
	projLoc = gl.getUniformLocation(program, "p");
	mvLoc = gl.getUniformLocation(program, "mv");

	//Set up viewport
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

	//Set up projection matrix
	p = perspective(45.0, gl.viewportWidth/gl.viewportHeight, 0.1, 100.0);
	gl.uniformMatrix4fv(projLoc, gl.FALSE, flatten(p));


	// Get and set global ambient uniforms
	global = {};
	global.top = gl.getUniformLocation(program,"global.top");
	global.bottom = gl.getUniformLocation(program,"global.bottom");
	global.direction = gl.getUniformLocation(program,"global.direction");
	var topColor = white;
	var bottomColor = black;
	gl.uniform4fv(global.top, topColor);
	gl.uniform4fv(global.bottom, bottomColor);

	//global.direction is set by text boxes and placed in world with lookAt in render function
	global.dir = vec4(0,1,0,0);



	//set global ambient UI to match default settings
	document.getElementById("topColor").jscolor.fromRGB(
			topColor[0]*255,
			topColor[1]*255,
			topColor[2]*255);

	document.getElementById("bottomColor").jscolor.fromRGB(
			bottomColor[0]*255,
			bottomColor[1]*255,
			bottomColor[2]*255);

	document.getElementById("dx").value = global.dir[0];
	document.getElementById("dy").value = global.dir[1];
	document.getElementById("dz").value = global.dir[2];


	//register global ambient UI events
	document.getElementById("dx").onchange = function(event) {
		global.dir[0]=(event.srcElement || event.target).value;
	};

	document.getElementById("dy").onchange = function(event) {
		global.dir[1]=(event.srcElement || event.target).value;
	};

	document.getElementById("dz").onchange = function(event) {
		global.dir[2]=(event.srcElement || event.target).value;
	};


	// Get and set material uniforms
	material = {};
	material.diffuse = gl.getUniformLocation(program, "material.diffuse");

	var diffuseColor = vec4(0.25, 0.3, 0.35, 1.0);
	gl.uniform4fv(material.diffuse, white);

	// Get and set other lighting state
	lighting = gl.getUniformLocation(program, "lighting");
	uColor = gl.getUniformLocation(program, "uColor");
	gl.uniform1i(lighting, 1);
	gl.uniform4fv(uColor, white);

	urgl = new uofrGraphics();
	urgl.connectShader(program, "vPosition", "vNormal", "stub");

	batman = loadObj(gl, "BatmanArmoured.obj");

	requestAnimFrame(render);
};

function setTopColor(picker) {
	gl.uniform4f(global.top, picker.rgb[0]/255.0, picker.rgb[1]/255.0, picker.rgb[2]/255.0, 1);
}
function setBottomColor(picker) {
	gl.uniform4f(global.bottom, picker.rgb[0]/255.0, picker.rgb[1]/255.0, picker.rgb[2]/255.0, 1);
}



//----------------------------------------------------------------------------
// Rendering Event Function
//----------------------------------------------------------------------------
var rx = 0, ry = 0;
function render()
{
	gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);


	//Set initial view
	var eye = vec3(0.0, 1.0, 6.0);
	var at =  vec3(0.0, 1.0, 0.0);
	var up =  vec3(0.0, 1.0, 0.0);

	mv = lookAt(eye,at,up);

	//Put light direction into world space
	gl.uniform4fv(global.direction, mult(transpose(mv), global.dir));

	//rebind local buffers to shader
	//necessary if uofrGraphics draw functions are used
	if (batman.loaded)
	{
		bindBuffersToShader();    
		//draw batman
		var cubeTF = mult(mv, mult(translate(0,-1,0),rotateY(ry)));
		gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(cubeTF));
		gl.drawElements(gl.TRIANGLES, batman.numIndices, gl.UNSIGNED_SHORT,0);	

	}

	var sphereTF = mult(mv, translate(-2,0,0));
	gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(sphereTF));
	urgl.drawSolidSphere(1,50,50);

	sphereTF = mult(mv, translate(2,0,0));
	gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(sphereTF));
	urgl.drawSolidSphere(1,50,50);

	ry += 0.5;

	requestAnimFrame(render);
}


