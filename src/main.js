import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {createCube,createPlane} from './utils/objects.js';
import {createControls} from './utils/controls.js';


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

const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 ); // Ajuste a intensidade da luz ambiente
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 ); // Adicione uma luz direcional
directionalLight.position.set( 5, 10, 7.5 );
scene.add( directionalLight );

camera.position.set(cube.position.x+15, cube.position.y , cube.position.z);
camera.lookAt(cube.position);

let time = 0;

function animate() {
  controls.update();

  // time += 0.01;
  // camera.position.z = Math.cos(time) * 10;
  renderer.render(scene, camera);
}