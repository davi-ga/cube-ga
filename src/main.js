import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water2.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0xF4FEFD, 1); // Define o fundo branco
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true; 
controls.dampingFactor = 0.25; 
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2; 

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
cube.position.set(-5, 0, 0)
scene.add( cube );

const geometry2 = new THREE.BoxGeometry( 0.98, 1, 1 );
const material2 = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
const cube2 = new THREE.Mesh( geometry2, material2 );
cube2.position.set(7, 0, 0);
scene.add( cube2 );

const wallGeometry = new THREE.BoxGeometry( 0.1, 10, 10 );
const wallMaterial = new THREE.MeshStandardMaterial( { color: 0x0000ff } );
const wall = new THREE.Mesh( wallGeometry, wallMaterial );
wall.position.set(1, 0, 0); 
scene.add( wall ); 

const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 ); // Ajuste a intensidade da luz ambiente
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 ); // Adicione uma luz direcional
directionalLight.position.set( 5, 10, 7.5 );
scene.add( directionalLight );

camera.position.set(cube.position.x-10, cube.position.y , cube.position.z + 10);
camera.lookAt(cube.position);

let time = 0;

function animate() {
  controls.update();

  // time += 0.01;
  // camera.position.z = Math.cos(time) * 10;
  camera.lookAt(cube.position);
  renderer.render(scene, camera);
}