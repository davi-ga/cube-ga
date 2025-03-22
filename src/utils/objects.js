import * as THREE from 'three';

function createCube(width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    return cube;
}
function createPlane(width, height) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000,side: THREE.DoubleSide});
    const plane = new THREE.Mesh(geometry, material);
    plane.rotateY(Math.PI/2);

    return plane;
}

export { createCube, createPlane };