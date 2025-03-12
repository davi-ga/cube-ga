import * as THREE from 'three';

function createCube(width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    const cubeAxesHelper = new THREE.AxesHelper(1); 
    cube.add(cubeAxesHelper);
    return cube;
}
function createPlane(width, height) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000,side: THREE.DoubleSide});
    const plane = new THREE.Mesh(geometry, material);
    const planeAxesHelper = new THREE.AxesHelper(1); 
    plane.add(planeAxesHelper);
    plane.rotateY(Math.PI/2);

    return plane;
}

export { createCube, createPlane };