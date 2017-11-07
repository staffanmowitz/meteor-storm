'use strict'

import * as THREE from 'three'
import THREEx from './threex.keyboardstate'
require('./obj-loader')(THREE)

let score = 0
let lives = 3

const livesContainer = document.createElement('div')
livesContainer.classList.add('lives')
let livesContent = document.createTextNode('Lives: ' + lives)
livesContainer.appendChild(livesContent)
document.body.appendChild(livesContainer)

const scoreContainer = document.createElement('div')
scoreContainer.classList.add('score')
let scoreContent = document.createTextNode('Score: ' + score)
scoreContainer.appendChild(scoreContent)
document.body.appendChild(scoreContainer)

const gameOver = function() {
  const gameOverContainer = document.createElement('div')
  gameOverContainer.classList.add('game-over')
  let gameOverContent = document.createTextNode('Game Over')
  gameOverContainer.appendChild(gameOverContent)
  document.body.appendChild(gameOverContainer)
}

// INITIALIZE RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// INITIALIZE KEYBOARD CONTROLS
const keyboard = new THREEx.KeyboardState(renderer.domElement)
renderer.domElement.setAttribute('tabIndex', '0')
renderer.domElement.focus()

let updateFcts = []

// GET RANDOM NUMBER
const randomNumber = function(min, max) {
  return Math.random() * (max - min) + min
}

const raycaster = new THREE.Raycaster()

const scene = new THREE.Scene()

// ADD CAMERA AND SET CAMERA POSITION
const camera = new THREE.PerspectiveCamera(
  75, // Fov
  window.innerWidth / window.innerHeight,
  0.1, // Near
  2000 // Far
)

camera.position.set(0, -70, 100)
camera.rotation.set(20, 0, 0)

// SET LIGHTING FOR THE SCENE
const pointLight = new THREE.PointLight(0xffffff)
pointLight.position.set(10, 50, 130)
scene.add(pointLight)

const ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.3)
scene.add(ambientLight)

// const fontLoader = new THREE.FontLoader()
//
// const textMaterial = new THREE.MeshPhongMaterial({
//   color: 0xff0000,
//   specular: 0xffffff
// })
//
// const updateScore = function(score) {
//   fontLoader.load('ambroney-normal.json', function(font) {
//     let textGeometry = new THREE.TextGeometry('Score: ' + score, {
//       font: font,
//       size: 80,
//       height: 20,
//       curveSegments: 12,
//       bevelEnabled: false,
//       bevelThickness: 5,
//       bevelSize: 2,
//       bevelSegments: 5
//     })
//
//     let textMesh = new THREE.Mesh(textGeometry, textMaterial)
//
//     textMesh.position.y = 1200
//     textMesh.position.x = -1300
//     textMesh.position.z = 100
//     textMesh.rotation.x = 1.2
//
//     scene.add(textMesh)
//     // scene.remove(textMesh)
//   })
// }

// CREATE METEOR STORM!
let meteorStorm = new THREE.Group()

let meteors = []
const meteorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 })
const meteorGeometry = new THREE.BoxGeometry(20, 20, 20)

let gems = []
const gemMaterial = new THREE.MeshLambertMaterial({ color: 0xe3c08b })
const gemGeometry = new THREE.IcosahedronGeometry(7)

let xtraLives = []
const xtraLifeMaterial = new THREE.MeshLambertMaterial({ color: 0xad4442 })
const xtraLifeGeometry = new THREE.IcosahedronGeometry(5)

// CREATE 100 GEMS AND RANDOMLY PLACE THEM ON THE CANVAS
for (let i = 0; i < 100; i++) {
  meteors[i] = new THREE.Mesh(meteorGeometry, meteorMaterial)
  meteors[i].position.y = randomNumber(500, 2000)
  meteors[i].position.x = randomNumber(-1000, 1000)
  meteors[i].mass = 1
  meteors[i].name = 'Meteor'

  meteorStorm.add(meteors[i])
}

// CREATE 10 GEMS AND RANDOMLY PLACE THEM ON THE CANVAS
for (let i = 0; i < 10; i++) {
  gems[i] = new THREE.Mesh(gemGeometry, gemMaterial)
  gems[i].position.y = randomNumber(500, 2000)
  gems[i].position.x = randomNumber(-800, 800)
  gems[i].mass = 0.7
  gems[i].name = 'Gem'

  meteorStorm.add(gems[i])
}

// CREATE 2 EXTRA LIVES AND RANDOMLY PLACE THEM ON THE CANVAS
for (let i = 0; i < 2; i++) {
  xtraLives[i] = new THREE.Mesh(xtraLifeGeometry, xtraLifeMaterial)
  xtraLives[i].position.y = randomNumber(500, 2000)
  xtraLives[i].position.x = randomNumber(-800, 800)
  xtraLives[i].mass = 0.5
  xtraLives[i].name = 'xtraLife'

  meteorStorm.add(xtraLives[i])
}

// GIVE METEORS AND GEMS RANDOM ROTATION AND VELOCITY VALUES
meteorStorm.children.forEach(child => {
  child.rotationValueX = randomNumber(-0.02, 0.02)
  child.rotationValueY = randomNumber(-0.02, 0.02)
  child.velocity = new THREE.Vector3(
    randomNumber(-0.3, 0.3),
    randomNumber(2, 5),
    // randomNumber(1, 3)
    0
  )
})

scene.add(meteorStorm)

//
const addToStorm = function(mesh) {
  mesh.position.y = 2100
  mesh.position.x = randomNumber(-800, 800)
  mesh.rotationValueX = randomNumber(-0.02, 0.02)
  mesh.rotationValueY = randomNumber(-0.02, 0.02)
  mesh.velocity = new THREE.Vector3(
    randomNumber(-0.3, 0.3),
    randomNumber(1, 3),
    randomNumber(1, 3)
  )
}

// CHECK FOR OBJECT COLLISIONS
const checkObjectCollisions = function(mesh) {
  for (
    let vertexIndex = 0;
    vertexIndex < mesh.geometry.vertices.length;
    vertexIndex++
  ) {
    const localVertex = mesh.geometry.vertices[vertexIndex].clone()
    const globalVertex = localVertex.applyMatrix4(mesh.matrix)
    const directionVector = globalVertex.sub(mesh.position)
    let angle = mesh.velocity.angleTo(directionVector)

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

// HANDLE OBJECT COLLISIONS
function handleObjectsCollision(meshA, collisionResult) {
  const objSize = 1
  const meshB = collisionResult.object
  const collision = new THREE.Vector3()

  if (meshA.name === 'Ship') {
    if (meshB.name === 'Gem') {
      score = score + 2000
    }

    if (meshB.name === 'xtraLife') {
      lives++
    }

    if (meshB.name === 'Meteor') {
      if (lives > 0) {
        lives--
      }
    }

    addToStorm(meshB)
    return
  }

  collision.x =
    (meshA.position.x * objSize + meshB.position.x * objSize) /
    (objSize + objSize)
  collision.y =
    (meshA.position.y * objSize + meshB.position.y * objSize) /
    (objSize + objSize)
  collision.z =
    (meshA.position.z * objSize + meshB.position.z * objSize) /
    (objSize + objSize)

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

/////////////////////
//  ADD SPACESHIP //
///////////////////
// INSTATINATE A LOADER
const loader = new THREE.OBJLoader()

// LOAD A RESOURCE
loader.load(
  // RESOURCE URL
  'spaceship.obj',
  // FUNCTION WHEN RESOURCE IS LOADED
  (ship, delta) => {
    ship.traverse(function(node) {
      const basicMaterial = new THREE.MeshLambertMaterial({
        color: 0xbbbbbb
      })

      if (node.geometry) {
        node.material.side = THREE.FrontSide
        node.material = basicMaterial
      }

      const geometry = new THREE.Geometry().fromBufferGeometry(
        ship.children[0].geometry
      )
      ship.geometry = geometry

      // DON'T USE DAT GUI
      ship.scale.set(0.05, 0.05, 0.05)
      ship.position.set(0, 10, 0)
      ship.rotation.set(6, 0, 3.13)

      ship.name = 'Ship'
      ship.velocity = new THREE.Vector3(0.1, 0.1, 0.1)

      scene.add(ship)
    })

    updateFcts.push(function(delta, now) {
      checkObjectCollisions(ship)
      //////////////////////
      //  MOVE SPACESHIP  //
      //////////////////////
      //  MOVE TO THE LEFT
      if (keyboard.pressed('left')) {
        ship.position.x -= 150 * delta

        // TILT LEFT
        if (ship.rotation.y > -1) {
          ship.rotation.y -= 2 * delta
        }
        // MOVE TO THE RIGHT
      } else if (keyboard.pressed('right')) {
        ship.position.x += 150 * delta

        // TILT RIGHT
        if (ship.rotation.y < 1) {
          ship.rotation.y += 2 * delta
        }
        // RESET LEFT TILT ON KEY UP
      } else if (ship.rotation.y > 0.05) {
        ship.rotation.y -= 2 * delta
        // RESET RIGHT TILT ON KEY UP
      } else if (ship.rotation.y < 0) {
        ship.rotation.y += 2 * delta
      } else {
        ship.rotation.y = 0
      }
    })
  }
)

// RENDER THE SCENE
updateFcts.push(function() {
  renderer.render(scene, camera)
})

let lastTimeMsec = null

requestAnimationFrame(function animate(nowMsec) {
  // KEEP LOOPING
  if (lives > 0) {
    requestAnimationFrame(animate)
  } else {
    gameOver()
  }

  // ADD METEORS
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

  score++

  scoreContent.textContent = `Score: ${score}`
  livesContent.textContent = `Lives: ${lives}`

  // MEASURE TIME
  lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
  const deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
  lastTimeMsec = nowMsec

  // CALL EACH UPDATE FUNCTION
  updateFcts.forEach(function(updateFn) {
    updateFn(deltaMsec / 1000, nowMsec / 1000)
  })
})

window.scene = scene
window.camera = camera
