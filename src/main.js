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

cube.material = new THREE.MeshBasicMaterial({ color: 0xff00ff});
cube.position.set(-5, 0, 0);
scene.add(cube);

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

uniform sampler2D u_mirrorTexture; // Textura da cena renderizada
uniform sampler2D u_waterTexture; // Textura da água
uniform float u_time;
uniform vec3 u_cameraPosition;

in vec2 vUv; // GLSL 3.0 input variable
out vec4 fragColor; // Output variable for fragment color

void main() {
    vec2 uv = vUv;

    // Simule o deslocamento da textura
    uv.x += sin(uv.y * 10.0 + u_time * 2.0) * 0.02;
    uv.y += cos(uv.x * 10.0 + u_time * 2.0) * 0.02;

    // Calcule a direção da refração
    vec3 viewDir = normalize(vec3(uv, 1.0) - u_cameraPosition);
    vec3 normal = vec3(0.0, 0.0, 1.0); // Normal do plano
    vec3 refractedDir = refract(viewDir, normal, 1.0 / 1.33); // Índice de refração da água

    // Ajuste as coordenadas UV com base na direção refratada
    vec2 refractedUV = uv + refractedDir.xy * 0.05;

    // Aplique a textura renderizada com o deslocamento e refração
    vec4 sceneColor = texture(u_mirrorTexture, refractedUV);

    // Aplique a textura da água
    vec4 waterColor = texture(u_waterTexture, uv);

    // Combine a textura da água com a textura renderizada
    fragColor = mix(sceneColor, waterColor, 0.5); // Misture as cores (50% cada)
}
`;
const loader = new THREE.TextureLoader();

const waterTexture = loader.load(
  "/water.png",
  () => console.log("Textura carregada com sucesso!"),
  undefined,
  (err) => console.error("Erro ao carregar a textura:", err)
);

const mirrorGeometry = new THREE.PlaneGeometry(10, 10);
const planeRefraction = new THREE.Mesh(
  mirrorGeometry,
  new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      u_mirrorTexture: { value: renderTarget.texture }, // Textura da cena renderizada
      u_waterTexture: { value: waterTexture }, // Textura da água
      u_time: { value: 5.0 },
      u_cameraPosition: { value: camera.position },
    },
  })
);

planeRefraction.position.set(0, 0, 0);
planeRefraction.rotateY(Math.PI/2);

scene.add(planeRefraction);


const ambientLight = new THREE.AmbientLight( 0xffffff, 1 ); // Ajuste a intensidade da luz ambiente
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 ); // Adicione uma luz direcional
directionalLight.position.set( 5, 10, 7.5 );
scene.add( directionalLight );

camera.position.set(cube.position.x+15, cube.position.y , cube.position.z);
camera.lookAt(cube.position);

function updateMirrorCamera(mainCamera, mirror, mirrorCamera) {
  let normal = new THREE.Vector3(0, 0, 1); // Normal of the Plane
  normal.applyQuaternion(planeRefraction.quaternion); // Adjust the rotation of the plane
  let d = normal.dot(planeRefraction.position);

  // Reflection of the Camera Position
  let mirroredPosition = camera.position.clone();
  mirroredPosition.sub(
    normal.clone().multiplyScalar(2 * (camera.position.dot(normal) - d))
  );

  mirrorCamera.position.copy(mirroredPosition);
  mirrorCamera.lookAt(planeRefraction.position);
  mirrorCamera.updateProjectionMatrix();
  mirrorCamera.scale.set(12, 12, 12);
}


function animate() {
  // Atualize os controles da câmera
  controls.update();

  // Atualize os uniformes do shader
  planeRefraction.material.uniforms.u_time.value += 0.01;
  planeRefraction.material.uniforms.u_cameraPosition.value.copy(camera.position);

  // Temporariamente oculte o plano para evitar que ele reflita a si mesmo
  planeRefraction.visible = false;

  // Renderize a cena para o renderTarget
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  // Torne o plano visível novamente
  planeRefraction.visible = true;

  // Renderize a cena principal
  renderer.render(scene, camera);
}