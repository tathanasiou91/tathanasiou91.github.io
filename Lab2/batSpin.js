/*
 * batSpin.js
 * Demonstrate lighting.
 *
 */


//----------------------------------------------------------------------------
// Variable Setup
//----------------------------------------------------------------------------

// This variable will store the WebGL rendering context
var gl;
var obj;

var red = [1.0, 0.0, 0.0, 1.0];
var green = [0.0, 1.0, 0.0, 1.0];
var blue = [0.0, 0.0, 1.0, 1.0];
var lightred = [1.0, 0.5, 0.5, 1.0];
var lightgreen = [0.5, 1.0, 0.5, 1.0];
var lightblue = [0.5, 0.5, 1.0, 1.0];
var white = [1.0, 1.0, 1.0, 1.0];
var black = [0.0, 0.0, 0.0, 1.0];



//Variables for Transformation Matrices
var mv = new mat4();
var p = new mat4();
var mvLoc, projLoc;

//Variables for Lighting
var light;
var material;
var lighting;
var uColor;

//You will need to rebind these buffers
//and point attributes at them after calling uofrGraphics draw functions
var vertexBuffer, normalBuffer;
var program;

//sphere subdivisions
var rez = 10;

function bindBuffersToShader(obj) {
   gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexObject);
   gl.vertexAttribPointer(program.vPosition, 3, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(program.vPosition);

   gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalObject);
   gl.vertexAttribPointer(program.vNormal, 3, gl.FLOAT, gl.FALSE, 0, 0);
   gl.enableVertexAttribArray(program.vNormal);

   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexObject);
}

//----------------------------------------------------------------------------
// Initialization Event Function
//----------------------------------------------------------------------------

window.onload = function init() {
   // Set up a WebGL Rendering Context in an HTML5 Canvas
   var canvas = document.getElementById("gl-canvas");
   gl = WebGLUtils.setupWebGL(canvas);
   if (!gl) {
      alert("WebGL isn't available");
   }

   //  Configure WebGL
   //  eg. - set a clear color
   //      - turn on depth testing
   gl.clearColor(1.0, 1.0, 1.0, 1.0);
   gl.enable(gl.DEPTH_TEST);

   //  Load shaders and initialize attribute buffers
   program = initShaders(gl, "vertex-shader", "fragment-shader");
   gl.useProgram(program);

   // Set up data to draw
   // Done globally in this program...
   gl.clearColor(0.25, 0.25, 0.25, 1);

   // Load the data into GPU data buffers and
   // Associate shader attributes with corresponding data buffers
   //***Vertices***
   program.vPosition = gl.getAttribLocation(program, "vPosition");
   gl.enableVertexAttribArray(program.vPosition);

   //***Normals***
   program.vNormal = gl.getAttribLocation(program, "vNormal");
   gl.enableVertexAttribArray(program.vNormal);

   //** uofrGraphics setup
   // relies on position and normal arrays
   // stub is used instead of the simple diffuse colour that
   // uofrGraphics was designed for, since we will be using
   // a more complex shader
   // uofrGraphics loads and binds its own buffers, so
   // watch out if you mix it with your own hand written geometry...
   urgl = new uofrGraphics();
   urgl.connectShader(program, "vPosition", "vNormal", "stub");

   //** start loading an obj.
   // The obj's buffers will need to be bound to draw them
   // see bindBuffersToShader() function for details.
   obj = loadObj(gl, "BatmanArmoured.obj");


   // Get addresses of transformation uniforms
   projLoc = gl.getUniformLocation(program, "p");
   mvLoc = gl.getUniformLocation(program, "mv");

   //Set up viewport
   gl.viewportWidth = canvas.width;
   gl.viewportHeight = canvas.height;
   gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

   //Set up projection matrix
   p = perspective(45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
   gl.uniformMatrix4fv(projLoc, gl.FALSE, flatten(p));


   // Get and set light uniforms
   light = []; // array of light property locations (defined globally)
   var n = 1; // number of lights - adjust to match shader
   for (var i = 0; i < n; i++) {
      light[i] = {}; // initialize this light object
      light[i].diffuse = gl.getUniformLocation(program, "light[" + i + "].diffuse");
      light[i].specular = gl.getUniformLocation(program, "light[" + i + "].specular");
      light[i].ambient = gl.getUniformLocation(program, "light[" + i + "].ambient");
      light[i].position = gl.getUniformLocation(program, "light[" + i + "].position");

      //initialize light 0 to default of white light coming from viewer
      if (i == 0) {
         gl.uniform4fv(light[i].diffuse, white);
         gl.uniform4fv(light[i].specular, white);
         gl.uniform4fv(light[i].ambient, vec4(0.2, 0.2, 0.2, 1.0));
         gl.uniform4fv(light[i].position, vec4(3.0, 3.0, 0.0, 1.0));
         light[0].rotY = 0;
      } else //disable all other lights
      {
         gl.uniform4fv(light[i].diffuse, black);
         gl.uniform4fv(light[i].specular, black);
         gl.uniform4fv(light[i].ambient, black);
         gl.uniform4fv(light[i].position, black);
      }
   }

   // Get and set material uniforms
   material = {};
   material.diffuse = gl.getUniformLocation(program, "material.diffuse");
   material.specular = gl.getUniformLocation(program, "material.specular");
   material.ambient = gl.getUniformLocation(program, "material.ambient");
   material.shininess = gl.getUniformLocation(program, "material.shininess");

   var diffuseColor = vec4(0.25, 0.3, 0.35, 1.0);
   gl.uniform4fv(material.diffuse, diffuseColor);
   gl.uniform4fv(material.specular, white);
   gl.uniform4fv(material.ambient, diffuseColor);
   gl.uniform1f(material.shininess, 50.0);

   // Get and set other shader state
   lighting = gl.getUniformLocation(program, "lighting");
   uColor = gl.getUniformLocation(program, "uColor");
   gl.uniform1i(lighting, 1);
   gl.uniform4fv(uColor, white);


   // ** setup event listeners and UI
   // Light rotY (direction) slider
	var ele = document.getElementById("rotY");
	ele.onchange = ele.oninput = function(event) {
      light[0].rotY=(event.srcElement || event.target).value;
      document.getElementById("directionval").innerHTML = light[0].rotY;
   };
   ele.value = 0;
   document.getElementById("directionval").innerHTML = 0;


   // Specular shininess slider
	ele = document.getElementById("shininess");
	ele.onchange = ele.oninput = function(event) {
      var shininess = (event.srcElement || event.target).value;
      document.getElementById("shininessval").innerHTML = shininess;
      gl.uniform1f(material.shininess, shininess);
   };
   ele.value = 50;
   document.getElementById("shininessval").innerHTML = 50;

   // Sphere resolution slider
	ele = document.getElementById("rez");
	ele.onchange = ele.oninput = function(event) {
      rez = (event.srcElement || event.target).value;
      document.getElementById("rezval").innerHTML = rez;
   };
   ele.value = rez;
   document.getElementById("rezval").innerHTML = rez;

   // Diffuse colour picker - set initial value
   document.getElementById("diffuseColor").jscolor.fromRGB(
			diffuseColor[0] * 255, 
			diffuseColor[1] * 255, 
			diffuseColor[2] * 255);

   // Specular colour picker - set initial value
   document.getElementById("specularColor").jscolor.fromHSV(
			specularColor[0] * 255, 
			specularColor[1] * 255, 
			specularColor[2] * 255);

   requestAnimFrame(render);
};



// Event listener for specular color picker - look in HTML to see where it is registered
function setSpecularColor(picker) {
   gl.uniform4f(material.specular, picker.rgb[0] / 255.0, picker.rgb[1] / 255.0, picker.rgb[2] / 255.0, 1);
}

// Event listener for diffuse and ambient color picker - look in HTML to see where it is registered
function setDiffuseColor(picker) {
   gl.uniform4f(material.diffuse, picker.rgb[0] / 255.0, picker.rgb[1] / 255.0, picker.rgb[2] / 255.0, 1);
   gl.uniform4f(material.ambient, picker.rgb[0] / 255.0, picker.rgb[1] / 255.0, picker.rgb[2] / 255.0, 1);
}



//----------------------------------------------------------------------------
// Rendering Event Function
//----------------------------------------------------------------------------
var rx = 0,  ry = 0;

function render()
{
   gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);


   //Set initial view
   var eye = vec3(0.0, 1.0, 6.0);
   var at = vec3(0.0, 1.0, 0.0);
   var up = vec3(0.0, 1.0, 0.0);

   mv = lookAt(eye, at, up);

   //Position Light in World
   gl.uniform4fv(light[0].position,
         mult(transpose(mv), mult(rotate(light[0].rotY,vec3(0,1,0)),vec4( 1,1,0,0))));

   //rebind local buffers to shader
   //necessary if uofrGraphics draw functions are used
   if (obj.loaded)
   {
      bindBuffersToShader(obj);
      //draw obj
      var objTF = mult(mv, mult(translate(0, -1, 0), rotate(ry,vec3(0,1,0))));
      gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(objTF));
      gl.drawElements(gl.TRIANGLES, obj.numIndices, gl.UNSIGNED_SHORT, 0);

   }

   var sphereTF = mult(mv, translate(-2, 0, 0));
   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(sphereTF));
   urgl.drawSolidSphere(1, rez, rez);

   sphereTF = mult(mv, translate(2, 0, 0));
   gl.uniformMatrix4fv(mvLoc, gl.FALSE, flatten(sphereTF));
   urgl.drawSolidSphere(1, rez, rez);

   ry += 0.5;

   requestAnimFrame(render);
}
