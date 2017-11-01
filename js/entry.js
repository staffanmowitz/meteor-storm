'use strict'

import * as THREE from 'three'
const OrbitControls = require('three-orbit-controls')(THREE)
require('./threejs/loaders/obj-loader')(THREE)

const loader = new THREE.OBJLoader()

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  75, // Fov
  window.innerWidth / window.innerHeight,
  0.1, // Near
  1000 // Far
)

camera.position.z = 200
camera.position.y = -270

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera)

// Set lighting for the scene
const pointLight = new THREE.PointLight(0xffffff)
pointLight.position.x = 10
pointLight.position.y = 50
pointLight.position.z = 130
scene.add(pointLight)

const ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.3)
scene.add(ambientLight)

let meteor
// load a resource
loader.load('meteor.obj', function(obj) {
  const material = new THREE.MeshLambertMaterial({ color: 0x999999 })

  obj.traverse(node => {
    if (node.geometry) {
      node.material = material
    }
  })

  obj.scale.set(50, 50, 50)

  scene.add(obj)
})

let meteors = []
const meteorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 })
const meteorGeometry = new THREE.BoxGeometry(20, 20, 20)

let gems = []
const gemMaterial = new THREE.MeshLambertMaterial({ color: 0xf2f24e })
const gemGeometry = new THREE.SphereGeometry(7, 7, 7)

let meteorGroup = new THREE.Group()

// Create 100 meteors and 10 gems and randomly place them in the canvas
for (var i = 0; i < 100; i++) {
  meteors[i] = new THREE.Mesh(meteorGeometry, meteorMaterial)
  meteors[i].position.y = Math.random() * (1200 - -200) + -200
  meteors[i].position.x = Math.random() * (1000 - -1000) + -1000

  meteorGroup.add(meteors[i])
}

for (var i = 0; i < 10; i++) {
  gems[i] = new THREE.Mesh(gemGeometry, gemMaterial)
  gems[i].position.y = Math.random() * (1200 - -200) + -200
  gems[i].position.x = Math.random() * (400 - -400) + -400

  meteorGroup.add(gems[i])
}

// Give each child of the meteor group random rotation values
meteorGroup.children.forEach(child => {
  child.rotationValueX = Math.random() * (0.02 - -0.02) + -0.02
  child.rotationValueY = Math.random() * (0.02 - -0.02) + -0.02
})

scene.add(meteorGroup)

const shipGeometry = new THREE.ConeGeometry(5, 20, 32)
const shipMaterial = new THREE.MeshLambertMaterial({
  color: 0xe1e1e1,
  side: THREE.DoubleSide
})
const ship = new THREE.Mesh(shipGeometry, shipMaterial)
ship.position.y = -170

scene.add(ship)

const animate = function() {
  requestAnimationFrame(animate)

  meteorGroup.position.y -= 2

  meteorGroup.children.forEach(child => {
    child.rotation.x += child.rotationValueX
    child.rotation.y += child.rotationValueY
  })

  renderer.render(scene, camera)
}

animate()

window.scene = scene
window.camera = camera
