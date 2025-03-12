import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function createControls(camera, renderer) {
  const controls = new OrbitControls( camera, renderer.domElement );
  controls.enableDamping = true; 
  controls.dampingFactor = 0.25; 
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2; 
  return controls;
}

export { createControls };