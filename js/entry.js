'use strict'

import * as THREE from 'three'

require('./threejs/loaders/obj-loader')(THREE)
const loader = new THREE.OBJLoader()

const randomNumber = function(min, max) {
  return Math.random() * (max - min) + min
}

const raycaster = new THREE.Raycaster()

const scene = new THREE.Scene()

// Add camera and set position
const camera = new THREE.PerspectiveCamera(
  75, // Fov
  window.innerWidth / window.innerHeight,
  0.1, // Near
  2000 // Far
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
  meteors[i].position.y = randomNumber(500, 2000)
  meteors[i].position.x = randomNumber(-1000, 1000)

  meteors[i].mass = 1

  meteorStorm.add(meteors[i])
}

for (var i = 0; i < 10; i++) {
  gems[i] = new THREE.Mesh(gemGeometry, gemMaterial)
  gems[i].position.y = randomNumber(500, 2000)
  gems[i].position.x = randomNumber(-800, 800)

  gems[i].mass = 0.7

  meteorStorm.add(gems[i])
}

// Give each child of the meteor group random rotation values
meteorStorm.children.forEach(child => {
  child.rotationValueX = randomNumber(-0.02, 0.02)
  child.rotationValueY = randomNumber(-0.02, 0.02)
  child.velocity = new THREE.Vector3(
    randomNumber(-0.3, 0.3),
    randomNumber(1, 3),
    randomNumber(1, 3)
  )
})

scene.add(meteorStorm)

const checkObjectCollisions = function(mesh) {
  for (
    let vertexIndex = 0;
    vertexIndex < mesh.geometry.vertices.length;
    vertexIndex++
  ) {
    const localVertex = mesh.geometry.vertices[vertexIndex].clone()
    const globalVertex = localVertex.applyMatrix4(mesh.matrix)
    const directionVector = globalVertex.sub(mesh.position)
    const angle = mesh.velocity.angleTo(directionVector)

    if (angle <= Math.PI / 2) {
      raycaster.set(mesh.position, directionVector.clone().normalize())
      const collisionResults = raycaster.intersectObjects(meteorStorm.children)

      if (
        collisionResults.length > 0 &&
        collisionResults[0].distance < directionVector.length()
      ) {
        handleObjectsCollision(mesh, collisionResults[0])
        break
      }
    }
  }
}

const OBJ_SIZE = 10

function handleObjectsCollision(meshA, collisionResult) {
  const meshB = collisionResult.object

  const collision = new THREE.Vector3()
  collision.x =
    (meshA.position.x * OBJ_SIZE + meshB.position.x * OBJ_SIZE) /
    (OBJ_SIZE + OBJ_SIZE)
  collision.y =
    (meshA.position.y * OBJ_SIZE + meshB.position.y * OBJ_SIZE) /
    (OBJ_SIZE + OBJ_SIZE)
  collision.z =
    (meshA.position.z * OBJ_SIZE + meshB.position.z * OBJ_SIZE) /
    (OBJ_SIZE + OBJ_SIZE)

  const masses = meshA.mass + meshB.mass
  const avX =
    (meshA.velocity.x * (meshA.mass - meshB.mass) +
      2 * meshB.mass * meshB.velocity.x) /
    masses
  const avY =
    (meshA.velocity.y * (meshA.mass - meshB.mass) +
      2 * meshB.mass * meshB.velocity.y) /
    masses
  const avZ =
    (meshA.velocity.z * (meshA.mass - meshB.mass) +
      2 * meshB.mass * meshB.velocity.z) /
    masses
  const bvX =
    (meshB.velocity.x * (meshB.mass - meshA.mass) +
      2 * meshA.mass * meshA.velocity.x) /
    masses
  const bvY =
    (meshB.velocity.y * (meshB.mass - meshA.mass) +
      2 * meshA.mass * meshA.velocity.y) /
    masses
  const bvZ =
    (meshB.velocity.z * (meshB.mass - meshA.mass) +
      2 * meshA.mass * meshA.velocity.z) /
    masses

  meshA.velocity.set(avX, avY, avZ)
  meshB.velocity.set(bvX, bvY, bvZ)
}

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
    child.position.y -= child.velocity.y
    child.position.x -= child.velocity.x
    child.updateMatrixWorld()
  })

  meteorStorm.children.forEach(child => {
    checkObjectCollisions(child)
  })

  renderer.render(scene, camera)
}

animate()

window.scene = scene
window.camera = camera
