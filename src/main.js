import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {createCube,createPlane} from './utils/objects.js';
import {createControls} from './utils/controls.js';
import { CubeCamera, WebGLCubeRenderTarget, MeshBasicMaterial } from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const controls = createControls(camera, renderer);

const cube = createCube(1, 1, 1);
cube.position.set(-5, 0, 0)
scene.add( cube );

const cube2 = createCube(1, 1, 1);
cube2.position.set(5, 0, 0)
scene.add( cube2 );

const plane = createPlane(5, 5);
plane.position.set(0, 0, 0); 
scene.add( plane ); 

const cubeRenderTarget = new WebGLCubeRenderTarget(256, { format: THREE.RGBAFormat });
const cubeCamera = new CubeCamera(0.1, 1000, cubeRenderTarget);

scene.add(cubeCamera);

// Criação do plano com material reflexivo
const reflectiveMaterial = new MeshBasicMaterial({
  envMap: cubeRenderTarget.texture,
});
plane.material = reflectiveMaterial;
plane.position.set(0, 0, 0);
scene.add(plane);

const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 ); // Ajuste a intensidade da luz ambiente
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 ); // Adicione uma luz direcional
directionalLight.position.set( 5, 10, 7.5 );
scene.add( directionalLight );

camera.position.set(cube.position.x+15, cube.position.y , cube.position.z);
camera.lookAt(cube.position);

let time = 0;

function animate() {

  // Atualize o CubeCamera
  plane.visible = false; // Esconda o plano para evitar capturar a si mesmo
  cubeCamera.update(renderer, scene);
  plane.visible = true;

  renderer.render(scene, camera);
}