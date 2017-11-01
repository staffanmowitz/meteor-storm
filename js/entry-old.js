'use strict'

import * as THREE from 'three'
require('./threejs/loaders/obj-loader')(THREE)
const OrbitControls = require('three-orbit-controls')(THREE)

var scene = new THREE.Scene()
var camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

var renderer = new THREE.WebGLRenderer()
renderer.setClearColor('#ffffff')
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera)

var directionalLight = new THREE.DirectionalLight(0x00ff00, -1.5)
directionalLight.position.set(1, 1, 1).normalize()
scene.add(directionalLight)

var ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.3)
// scene.add(ambientLight)

var geometry = new THREE.BoxGeometry(1, 1, 1)
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
var cube = new THREE.Mesh(geometry, material)
// scene.add(cube);

camera.position.z = 300

// LOAD SPACESHIP
// import spaceship from './spaceship.obj'
//
// console.log(spaceship)

var loader = new THREE.OBJLoader()

var ship = null

loader.load('B2_full.obj', function(obj) {
  ship = obj

  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide
  })

  obj.traverse(node => {
    if (node.geometry) {
      node.material = material
    }
  })

  obj.rotation.x = 90

  scene.add(obj)
})

var animate = function() {
  requestAnimationFrame(animate)

  // cube.rotation.x += 0.05;
  if (ship) {
    // ship.rotation.x += 0.05;
  }

  renderer.render(scene, camera)
}

animate()

window.scene = scene
