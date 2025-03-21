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
uniform float u_depthFactor; // Fator de profundidade para ajustar o deslocamento

in vec2 vUv; // GLSL 3.0 input variable
out vec4 fragColor; // Output variable for fragment color

void main() {
    vec2 uv = vUv;

    // Simule o deslocamento da textura
    float depthEffect = 1.0 - u_depthFactor; // Reduz o deslocamento com base no fator de profundidade
    uv.x += sin(uv.y * 10.0 + u_time * 2.0) * 0.02 * depthEffect;
    uv.y += cos(uv.x * 10.0 + u_time * 2.0) * 0.02 * depthEffect;

    // Calcule a direção da refração
    vec3 viewDir = normalize(vec3(uv, 1.0) - u_cameraPosition);
    vec3 normal = vec3(0.0, 0.0, 1.0); // Normal do plano
    vec3 refractedDir = refract(viewDir, normal, 1.0 / 1.33); // Índice de refração da água

    // Ajuste as coordenadas UV com base na direção refratada
    vec2 refractedUV = uv + refractedDir.xy * 0.05 * depthEffect;

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
      u_depthFactor: { value: 0.5 }, // Ajuste este valor para controlar o efeito
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
  // Use uma normal fixa no espaço do mundo
  const normal = new THREE.Vector3(0, 1, 0); // Normal fixa apontando para cima

  // Distância do plano à origem
  const d = -normal.dot(mirror.position);

  // Reflete a posição da câmera principal
  const cameraPosition = mainCamera.position.clone();
  const distanceToPlane = normal.dot(cameraPosition) + d;
  const reflectedPosition = cameraPosition.clone().sub(
    normal.clone().multiplyScalar(2 * distanceToPlane)
  );

  // Reflete a direção de visão da câmera principal
  const lookAt = new THREE.Vector3();
  mainCamera.getWorldDirection(lookAt);
  const reflectedLookAt = lookAt.clone().sub(
    normal.clone().multiplyScalar(2 * normal.dot(lookAt))
  );

  // Atualiza a posição e orientação da câmera do espelho
  mirrorCamera.position.copy(reflectedPosition);

  // Corrige a direção da câmera refletida
  const target = reflectedPosition.clone().add(reflectedLookAt);
  mirrorCamera.lookAt(target);

  // Ajusta o vetor "up" da câmera para evitar inversões
  const cameraUp = mainCamera.up.clone();
  const reflectedUp = cameraUp.sub(
    normal.clone().multiplyScalar(2 * normal.dot(cameraUp))
  );
  mirrorCamera.up.copy(reflectedUp);

  // Atualiza a matriz de projeção da câmera
  mirrorCamera.updateProjectionMatrix();
}

function animate() {
  // Atualize os controles da câmera
  controls.update();

  // Atualize os uniformes do shader
  planeRefraction.material.uniforms.u_time.value += 0.01;
  planeRefraction.material.uniforms.u_cameraPosition.value.copy(camera.position);


  planeRefraction.material.uniforms.u_depthFactor.value = 0.5;
  // Atualize a câmera do espelho
  updateMirrorCamera(camera, planeRefraction, mirrorCamera);

  // Temporariamente oculte o plano para evitar que ele reflita a si mesmo
  planeRefraction.visible = false;

  // Renderize a cena para o renderTarget usando a mirrorCamera
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, mirrorCamera);
  renderer.setRenderTarget(null);

  // Torne o plano visível novamente
  planeRefraction.visible = true;

  // Renderize a cena principal
  renderer.render(scene, camera);
}