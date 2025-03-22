// Import necessary modules from Three.js
import * as THREE from 'three';
import { createCube, createPlane } from './utils/objects.js';
import { createControls } from './utils/controls.js';
import * as dat from 'dat.gui';

// Create a new Three.js scene
const scene = new THREE.Scene();

// Set up the camera with a perspective projection
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);

// Create a WebGL renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight); // Set the renderer size
renderer.setAnimationLoop(animate); // Set the animation loop
document.body.appendChild(renderer.domElement); // Append the renderer to the DOM

// Create a render target for off-screen rendering
const renderTarget = new THREE.WebGLRenderTarget(2048, 2048, {
  minFilter: THREE.LinearFilter, // Minification filter
  magFilter: THREE.LinearFilter, // Magnification filter
  format: THREE.RGBAFormat, // Texture format
});

// Create camera controls
const controls = createControls(camera, renderer);
const loader = new THREE.TextureLoader();

const waterTexture = loader.load(
  "/water.png", // Texture path
  () => console.log("Texture loaded successfully!"), // On load callback
  undefined, // On progress callback
  (err) => console.error("Error loading texture:", err) // On error callback
);
const dirtTexture = loader.load(
  "/dirt.jpg", // Texture path
  () => console.log("Texture loaded successfully!"), // On load callback
  undefined, // On progress callback
  (err) => console.error("Error loading texture:", err) // On error callback
);

const rockTexture = loader.load(
  "/rock.jpg", // Texture path
  () => console.log("Texture loaded successfully!"), // On load callback
  undefined, // On progress callback
  (err) => console.error("Error loading texture:", err) // On error callback
);

// Create the first cube and set its properties
const cube = createCube(1, 1, 1);
cube.material = new THREE.MeshBasicMaterial({ map: dirtTexture }); // Set the cube's material to use terrainTexture
cube.position.set(-5, 0, 0); // Set the cube's position
scene.add(cube); // Add the cube to the scene

// Create the second cube and set its properties
const cube2 = createCube(1, 1, 1);
cube2.material = new THREE.MeshBasicMaterial({ map: rockTexture }); // Set the cube's material to use rockTexture
cube2.position.set(5, 0, 0); // Set the cube's position
scene.add(cube2); // Add the cube to the scene

// Vertex shader for the water effect
const vertexShader = `
precision mediump float;

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader for the water effect
const fragmentShader = `
precision mediump float;

uniform sampler2D u_mirrorTexture; // Rendered scene texture
uniform sampler2D u_waterTexture; // Water texture
uniform float u_time;
uniform vec3 u_cameraPosition;
uniform float u_opacity; // Opacity control

in vec2 vUv; // GLSL 3.0 input variable
out vec4 fragColor; // Output variable for fragment color

void main() {
    vec2 uv = vUv;

    // Simulate texture displacement
    uv.x += sin(uv.y * 10.0 + u_time * 2.0) * 0.02;
    uv.y += cos(uv.x * 10.0 + u_time * 2.0) * 0.02;

    // Calculate refraction direction
    vec3 viewDir = normalize(vec3(uv, 1.0) - u_cameraPosition);
    vec3 normal = vec3(0.0, 0.0, 1.0); // Plane normal
    vec3 refractedDir = refract(viewDir, normal, 1.0 / 1.33); // Refraction index of water

    // Adjust UV coordinates based on refraction direction
    vec2 refractedUV = uv + refractedDir.xy * 0.05;

    // Apply the rendered scene texture with displacement and refraction
    vec4 sceneColor = texture(u_mirrorTexture, refractedUV);

    // Apply the water texture
    vec4 waterColor = texture(u_waterTexture, uv);

    // Combine the water texture with the rendered scene texture
    vec4 mixedColor = mix(sceneColor, waterColor, 0.5); // Blend colors (50% each)

    // Adjust opacity
    fragColor = vec4(mixedColor.rgb, u_opacity); // Apply opacity
}
`;

// Load the water texture


// Create a plane geometry for the water effect
const mirrorGeometry = new THREE.PlaneGeometry(10, 10);
const planeRefraction = new THREE.Mesh(
  mirrorGeometry,
  new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, // Use GLSL 3.0
    vertexShader: vertexShader, // Vertex shader
    fragmentShader: fragmentShader, // Fragment shader
    transparent: true, // Enable transparency
    uniforms: {
      u_mirrorTexture: { value: renderTarget.texture }, // Rendered scene texture
      u_waterTexture: { value: waterTexture }, // Water texture
      u_time: { value: 5.0 }, // Time uniform
      u_cameraPosition: { value: camera.position }, // Camera position uniform
      u_opacity: { value: 1.0}, // Opacity uniform
    },
  })
);

planeRefraction.position.set(0, 0, 0); // Set the plane's position
planeRefraction.rotateY(Math.PI / 2); // Rotate the plane

scene.add(planeRefraction); // Add the plane to the scene

// Add ambient light to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Set light color and intensity
scene.add(ambientLight);

// Add directional light to the scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Set light color and intensity
directionalLight.position.set(5, 10, 7.5); // Set light position
scene.add(directionalLight);

// Set the camera's initial position and orientation
camera.position.set(cube.position.x + 15, cube.position.y, cube.position.z);
camera.lookAt(cube.position);

// Create a GUI for controlling parameters
const gui = new dat.GUI();
const params = {
  opacity: 1.0, // Initial opacity value
};

// Add an opacity slider to the GUI
gui.add(params, 'opacity', 0, 1, 0.01).name('Opacity').onChange((value) => {
  planeRefraction.material.uniforms.u_opacity.value = value; // Update opacity uniform
});

// Animation loop
function animate() {
  controls.update(); // Update camera controls

  // Update shader uniforms
  planeRefraction.material.uniforms.u_time.value += 0.01; // Increment time
  planeRefraction.material.uniforms.u_cameraPosition.value.copy(camera.position); // Update camera position

  planeRefraction.visible = false; // Hide the plane during off-screen rendering

  // Render the scene to the render target
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null); // Reset render target

  planeRefraction.visible = true; // Show the plane again

  // Render the final scene
  renderer.render(scene, camera);
}