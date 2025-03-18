import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {createCube,createPlane} from './utils/objects.js';
import {createControls} from './utils/controls.js';
// import vertexShader from "./utils/shaders/vertex.glsl";
// import fragmentShader from "./utils/shaders/fragment.glsl";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const renderTarget = new THREE.WebGLRenderTarget(2048, 2048, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});

const mirrorCamera = new THREE.PerspectiveCamera(
  75,
  innerWidth + innerHeight / innerHeight - innerWidth,
  1,
  500
);


const controls = createControls(camera, renderer);

const cube = createCube(1, 1, 1);
cube.position.set(-10, 0, 0)
scene.add( cube );

const cube2 = createCube(1, 1, 1);
cube2.position.set(5, 0, 0)
scene.add( cube2 );

const vertexShader = `
precision mediump float;

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision mediump float;

uniform sampler2D u_mirrorTexture;
in vec2 vUv; // GLSL 3.0 input variable
out vec4 fragColor; // Output variable for fragment color

void main() {
    vec4 mirrorColor = texture(u_mirrorTexture, vUv); // Sample the texture
    fragColor = mirrorColor; // Assign the sampled color to the output
}
`;

const mirrorGeometry = new THREE.PlaneGeometry(10, 10);
const planeRefraction = new THREE.Mesh(
  mirrorGeometry,
  new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,

    uniforms: {
      u_mirrorTexture: { value: renderTarget.texture },
      u_time: { value: 5.0 },
      u_alpha: { value: 0.5 }, // Adjust transparency
    },
    transparent: true,
  })
);

planeRefraction.position.set(0, 0, 0);
planeRefraction.rotateY(Math.PI/2);

scene.add(planeRefraction);


const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 ); // Ajuste a intensidade da luz ambiente
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 ); // Adicione uma luz direcional
directionalLight.position.set( 5, 10, 7.5 );
scene.add( directionalLight );

camera.position.set(cube.position.x+20, cube.position.y , cube.position.z);
camera.lookAt(cube.position);

function updateMirrorCamera(mainCamera, mirror, mirrorCamera) {
  let normal = new THREE.Vector3(0, 0, 1); // Normal of the Plane
  normal.applyQuaternion(planeRefraction.quaternion); // Adjust the rotation of the plane
  let d = normal.dot(planeRefraction.position);

  // Reflection of the Camera Position
  let mirroredPosition = camera.position.clone();
  mirroredPosition.sub(
    normal.clone().multiplyScalar(2 * (camera.position.dot(normal) + d))
  );

  mirrorCamera.position.copy(mirroredPosition);
  mirrorCamera.lookAt(planeRefraction.position);
  mirrorCamera.updateProjectionMatrix();
  mirrorCamera.scale.set(12, 12, 12);
}


function animate() {
  // Atualize os controles da câmera
  controls.update();

  console.log('Camera Position:', camera.position);
  // Temporariamente oculte o plano para evitar que ele reflita a si mesmo
  planeRefraction.visible = false;

  // Atualize a posição e orientação da câmera do espelho
  updateMirrorCamera(camera, planeRefraction, mirrorCamera);

  // Renderize a cena para o renderTarget
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, mirrorCamera);
  renderer.setRenderTarget(null);

  // Torne o plano visível novamente
  planeRefraction.visible = true;

  // Renderize a cena principal
  renderer.render(scene, camera);
}
