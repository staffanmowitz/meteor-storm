'use strict'

import * as THREE from 'three'

require('./threejs/loaders/obj-loader')(THREE)
const loader = new THREE.OBJLoader()

const randomNumber = function(min, max) {
  return Math.random() * (max - min) + min
}

const scene = new THREE.Scene()

// Add camera and set position
const camera = new THREE.PerspectiveCamera(
  75, // Fov
  window.innerWidth / window.innerHeight,
  0.1, // Near
  1000 // Far
)

camera.position.set(0, -70, 100)
camera.rotation.set(20, 0, 0)

// const helper = new THREE.CameraHelper(camera)
// scene.add(helper)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Set lighting for the scene
const pointLight = new THREE.PointLight(0xffffff)
pointLight.position.set(10, 50, 130)
scene.add(pointLight)

const ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.3)
scene.add(ambientLight)

let meteors = []
const meteorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 })
const meteorGeometry = new THREE.BoxGeometry(20, 20, 20)
const venusMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 })

let gems = []
const gemMaterial = new THREE.MeshLambertMaterial({ color: 0xf2f24e })
const gemGeometry = new THREE.IcosahedronGeometry(7)

let meteorStorm = new THREE.Group()

// Create 100 meteors and 10 gems and randomly place them in the canvas
for (var i = 0; i < 100; i++) {
  meteors[i] = new THREE.Mesh(meteorGeometry, meteorMaterial)
  meteors[i].position.y = randomNumber(200, 1200)
  meteors[i].position.x = randomNumber(-1000, 1000)

  meteorStorm.add(meteors[i])
}

for (var i = 0; i < 10; i++) {
  gems[i] = new THREE.Mesh(gemGeometry, gemMaterial)
  gems[i].position.y = randomNumber(200, 1200)
  gems[i].position.x = randomNumber(-800, 800)

  meteorStorm.add(gems[i])
}

// Give each child of the meteor group random rotation values
meteorStorm.children.forEach(child => {
  child.rotationValueX = randomNumber(-0.02, 0.02)
  child.rotationValueY = randomNumber(-0.02, 0.02)
  child.speed = randomNumber(1, 3)
  child.direction = randomNumber(-0.3, 0.3)
})

scene.add(meteorStorm)

// // Add the ship
loader.load('B2_full.obj', ship => {
  const shipMaterial = new THREE.MeshLambertMaterial({
    color: 0x888888
  })

  ship.traverse(node => {
    if (node.geometry) {
      node.material = shipMaterial
    }
  })

  ship.rotation.z = 3.15
  ship.scale.set(0.1, 0.1, 0.1)

  scene.add(ship)
})

const animate = function() {
  requestAnimationFrame(animate)

  meteorStorm.children.forEach(child => {
    child.rotation.x += child.rotationValueX
    child.rotation.y += child.rotationValueY
    child.position.y -= child.speed
    child.position.x -= child.direction
  })

  renderer.render(scene, camera)
}

animate()

window.scene = scene
window.camera = camera
