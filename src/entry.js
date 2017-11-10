// TODO
// - Skeppet ska inte kunna åka utanför skärmen
// ✓ Rotation på meteorer
// ✓ Tilt på skeppet
// - Använda modeller för meteorer
// ✓ Endast ett collide-event per krock!
// - Intro
// - Outro efter game over
// - Explodera meteorer
// - Explodera skepp
// - Shield/glow på skepp
// ✓ Håll kvar meteorer på z-axeln
// - Pause?
// - Remove & dispose explosion pieces
// - Clean!

import * as THREE from 'three'
import * as CANNON from 'cannon'
import * as Howler from 'howler'
require('./cannondebugrenderer.js')(THREE, CANNON)
require('./OBJLoader.js')(THREE)
const mesh2shape = require('three-to-cannon')
import THREEx from './threex.keyboardstate'

function rand(min, max) {
  return Math.random() * (max - min) + min
}

let world
let camera
let scene
let renderer

let cannonMeteor
let cannonGem

let updateFns = []

let cannonMeteors = []
let cannonGems = []

let threeMeteors = []
let threeGems = []

let initMeteorPos = []
var timeStep = 1 / 60

let score = 0
let bonus = 0
let lives = 3

// ADD SOUND EFFECTS
const bonusSound = new Howl({ src: 'bonus.wav' })
const lifeSound = new Howl({ src: 'life.wav' })
const crashSound = new Howl({ src: 'crash.wav' })
const music = new Howl({ src: 'highway-slaughter.mp3', volume: 0.5 })

music.play()

// ADD LIVES COUNTER
const livesContainer = document.createElement('div')
livesContainer.classList.add('lives')
let livesContent = document.createTextNode('Lives: ' + lives)
livesContainer.appendChild(livesContent)
document.body.appendChild(livesContainer)

// ADD SCORE COUNTER
const scoreContainer = document.createElement('div')
scoreContainer.classList.add('score')
let scoreContent = document.createTextNode('Score: ' + score)
scoreContainer.appendChild(scoreContent)
document.body.appendChild(scoreContainer)

// ADD GAME OVER TEXT
const gameOver = function(shipBody, threeShip) {
  world.removeBody(shipBody)
  scene.remove(threeShip)
  music.fade(0.5, 0, 1000)
  const gameOverContainer = document.createElement('div')
  gameOverContainer.classList.add('game-over')
  // let gameOverContent = document.createTextNode('Game Over')
  // gameOverContainer.appendChild(gameOverContent)
  gameOverContainer.innerHTML =
    '<p class="large">Game Over</p><p>Your Score: ' + (score + bonus) + '</p>'
  document.body.appendChild(gameOverContainer)
}

initCannon()

// CREATE THREE SCENE
scene = new THREE.Scene()

// ADD CAMERA TO THE SCENE
camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
)
camera.position.set(0, -70, 100)
camera.rotation.set(20, 0, 0)

scene.add(camera)

// SET LIGHTING FOR THE SCENE
const pointLight = new THREE.PointLight(0xffffff)
pointLight.position.set(10, 50, 130)
scene.add(pointLight)

const ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.3)
scene.add(ambientLight)

// INITIALIZE RENDERER
renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x000000)
document.body.appendChild(renderer.domElement)

// CREATE BACKGROUND GRID
let ackY = 0
let ackX = -1000
let gridX = []

for (var i = 0; i < 40; i++) {
  var lineMaterial = new THREE.LineBasicMaterial({
    color: 0x4ef7da,
    blending: THREE.AdditiveBlending
  })

  var lineXGeometry = new THREE.Geometry()
  lineXGeometry.vertices.push(new THREE.Vector3(-1000, 0, -30))
  lineXGeometry.vertices.push(new THREE.Vector3(1000, 0, -30))

  var lineX = new THREE.Line(lineXGeometry, lineMaterial)
  lineX.position.y = ackY
  ackY += 100
  gridX.push(lineX)
  scene.add(lineX)

  var lineYGeometry = new THREE.Geometry()
  lineYGeometry.vertices.push(new THREE.Vector3(0, -100, -30))
  lineYGeometry.vertices.push(new THREE.Vector3(0, 2000, -30))

  var lineY = new THREE.Line(lineYGeometry, lineMaterial)

  lineY.position.x = ackX
  ackX += 50

  scene.add(lineY)
}

// INITIALIZE CANNON DEBUG RENDERER
var cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world)

// INITIALIZE KEYBOARD CONTROLS
var keyboard = new THREEx.KeyboardState(renderer.domElement)
renderer.domElement.setAttribute('tabIndex', '0')
renderer.domElement.focus()

// EXPLOSION
let explosion = new THREE.Group()
let explosionPieces = []
const explosionPiecesMaterial = new THREE.MeshLambertMaterial({
  color: 0xffffff
})

const explosionPiecesGeometry = new THREE.TetrahedronGeometry(2)

// PLACE EXPLOSION IN FRONT OF SHIP
const explode = function(explosionPos) {
  for (let i = 0; i < 100; i++) {
    explosionPieces[i] = new THREE.Mesh(
      explosionPiecesGeometry,
      explosionPiecesMaterial,
      0
    )

    explosionPieces[i].position.set(explosionPos.x, explosionPos.y + 30, 0)
    explosionPieces[i].rotationValueX = rand(-0.2, 0.2)
    explosionPieces[i].rotationValueY = rand(-0.2, 0.2)
    explosionPieces[i].velocity = new THREE.Vector3(
      rand(-2, 2),
      rand(-2, 1),
      rand(-2, 2)
    )
    explosion.add(explosionPieces[i])
  }
  scene.add(explosion)

  // setTimeout(function() {
  //   console.log('hej')
  //   scene.remove(explosion)
  // }, 5000)
}

// CREATE CANNON.JS WORLD
function initCannon() {
  world = new CANNON.World()
  // world.gravity.set(0, 0, 0)
  world.broadphase = new CANNON.NaiveBroadphase()
  world.solver.iterations = 10

  // CREATE CANNON.JS METEORS
  const meteorShape = new CANNON.Box(new CANNON.Vec3(10, 10, 10))

  for (var i = 0; i < 100; i++) {
    cannonMeteor = new CANNON.Body({
      mass: 5
      // linearFactor: new CANNON.Vec3(0, 0, 0)
      // angularFactor: new CANNON.Vec3(0, 0, 0)
    })
    cannonMeteor.addShape(meteorShape)

    // PLACE METEORS RANDOMLY ON CANVAS AND GIVE THEM RANDOM VELOCITY
    initMeteorPos.push(rand(-3, -1))
    cannonMeteor.position.set(rand(-1000, 1000), rand(500, 2000), 0)
    cannonMeteor.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0)

    cannonMeteor.name = 'Meteor'

    cannonMeteor.applyLocalImpulse(
      new CANNON.Vec3(rand(-50, 50), rand(-50, 50), rand(-50, 50)),
      new CANNON.Vec3(rand(-30, 30), rand(-30, 30), rand(-30, 30))
    )

    world.addBody(cannonMeteor)
    cannonMeteors.push(cannonMeteor)
  }

  const gemShape = new CANNON.Box(new CANNON.Vec3(5, 5, 5))

  for (var i = 0; i < 10; i++) {
    cannonGem = new CANNON.Body({
      mass: 2,
      linearFactor: new CANNON.Vec3(0, 1, 0)
    })
    cannonGem.addShape(gemShape)

    // PLACE GEMS RANDOMLY ON CANVAS
    initMeteorPos.push(rand(-3, -1))
    cannonGem.position.set(rand(-1000, 1000), rand(500, 2000), 0)
    cannonGem.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0)

    cannonGem.name = 'Gem'

    world.addBody(cannonGem)
    cannonGems.push(cannonGem)
  }
}

// CREATE THREE.JS METEORS
const meteorGeometry = new THREE.BoxGeometry(20, 20, 20)
const meteorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 })

cannonMeteors.forEach(meteor => {
  const cube = new THREE.Mesh(meteorGeometry, meteorMaterial)
  scene.add(cube)
  threeMeteors.push(cube)
})

// CREATE THREE.JS GEMS
const gemGeometry = new THREE.BoxGeometry(10, 10, 10)
const gemMaterial = new THREE.MeshLambertMaterial({ color: 0xff00ff })

cannonGems.forEach(gem => {
  const cube = new THREE.Mesh(gemGeometry, gemMaterial)
  scene.add(cube)
  threeGems.push(cube)
})

// CREATE SHIP
// INSTANTIATE A LOADER
var loader = new THREE.OBJLoader()

// LOAD A RESOURCE
loader.load(
  // RESOURCE URL
  'spaceship.obj',
  // CALLED WHEN RESOURCE IS LOADED
  function(threeShip) {
    threeShip.scale.set(0.05, 0.05, 0.05)
    threeShip.rotation.x = 6.3
    threeShip.rotation.z = 3.13
    threeShip.position.y = 10

    const shipNewMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })

    const cannonShip = mesh2shape(threeShip, { type: mesh2shape.Type.SPHERE })
    cannonShip.radius = 10
    const shipBody = new CANNON.Body()
    shipBody.addShape(cannonShip)
    shipBody.position.y = 10

    world.addBody(shipBody)

    // ADD COLLIDE EVENT LISTENER
    shipBody.addEventListener('collide', e => {
      console.log('Skeppet krockade med en ' + e.body.name)

      if (e.body.name === 'Meteor') {
        if (lives >= 0) {
          // console.log(e.target.position)
          lives--
          explode(e.target.position)
          crashSound.play()
          // e.body.velocity.set(-500, 500, 500)
          e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0)
        }

        if (lives === 0) {
          gameOver(shipBody, threeShip)
        }
      }

      if (e.body.name === 'Gem') {
        bonus += 5000
        bonusSound.play()
        e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0)
      }
    })

    updateFns.push(() => {
      ////////////////////////////////////////
      // MOVE SPACESHIP                    //
      ///////////////////////////////////////
      //MOVE TO THE LEFT
      if (keyboard.pressed('left') && shipBody.position.x > -150) {
        shipBody.position.x -= 4

        // // TILT LEFT
        if (threeShip.rotation.y > -1) {
          threeShip.rotation.y -= 0.1
          // * delta;
        }
        // MOVE TO THE RIGHT
      } else if (keyboard.pressed('right') && shipBody.position.x < 150) {
        shipBody.position.x += 4

        // TILT RIGHT
        if (threeShip.rotation.y < 1) {
          threeShip.rotation.y += 0.1
          // * delta;
        }
      } else if (keyboard.pressed('up') && shipBody.position.y < 100) {
        shipBody.position.y += 4
      } else if (keyboard.pressed('down') && shipBody.position.y > 10) {
        shipBody.position.y -= 4
      } else if (threeShip.rotation.y > 0.5) {
        // RESET LEFT TILT ON KEY UP
        threeShip.rotation.y -= 0.1
        // * delta
        // RESET RIGHT TILT ON KEY UP
      } else if (threeShip.rotation.y < 0) {
        threeShip.rotation.y += 0.1
        // * delta
      } else {
        threeShip.rotation.y = 0
      }

      threeShip.position.copy(shipBody.position)
    })

    scene.add(threeShip)
  },
  // CALLED WHEN LOADING IS IN PROGRESSES
  function(xhr) {
    console.log(xhr.loaded / xhr.total * 100 + '% loaded')
  },
  // CALLED WHEN LOADING HAS ERRORS
  function(error) {
    console.log('An error happened')
  }
)

function animate() {
  requestAnimationFrame(animate)
  updatePhysics()
  cannonDebugRenderer.update()
  updateGrid()
  updateExplosions()
  render()

  updateFns.forEach(fn => {
    fn()
  })

  if (lives >= 0) {
    score++
    scoreContent.textContent = `Score: ${score + bonus}`
    livesContent.textContent = `Lives: ${lives}`
  }
}
animate()

function updatePhysics() {
  cannonDebugRenderer.update()

  // STEP THE PHYSICS WORLD
  world.step(timeStep)

  // COPY COORDINATES FROM CANNON.JS TO THREE.JS
  cannonMeteors.forEach((meteor, index) => {
    threeMeteors[index].position.copy(meteor.position)
    meteor.position.y += initMeteorPos[index] - score / 500
    meteor.position.z = 0

    threeMeteors[index].quaternion.copy(meteor.quaternion)

    // PUT OBJECT BACK IN STORM
    if (
      meteor.position.y < -10 ||
      meteor.position.x > 1000 ||
      meteor.position.x < -1000
    ) {
      meteor.position.set(rand(-1000, 1000), rand(1000, 2000), 0)
      meteor.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0)
    }
  })

  cannonGems.forEach((gem, index) => {
    threeGems[index].position.copy(gem.position)
    threeGems[index].quaternion.copy(gem.quaternion)
    gem.position.y += initMeteorPos[index] - score / 500
    gem.position.z = 0

    // PUT OBJECT BACK IN STORM
    if (
      gem.position.y < -10 ||
      gem.position.x > 1000 ||
      gem.position.x < -1000
    ) {
      gem.position.set(rand(-1000, 1000), rand(1000, 2000), 0)
      gem.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0)
    }
  })
}

// EXPLOSION
function updateExplosions() {
  explosion.children.forEach(child => {
    child.rotation.x += child.rotationValueX
    child.rotation.y += child.rotationValueY
    child.position.y -= child.velocity.y
    child.position.x -= child.velocity.x
    child.position.z -= child.velocity.z
  })
}

if (scene.getObjectByName('Explosion')) {
  console.log('hej')
}

// MOVE BACKGROUND GRID
function updateGrid() {
  gridX.forEach(line => {
    if (line.position.y > 2000) {
      line.position.y = 0
    }
    line.position.y += 2
  })
}

function render() {
  renderer.render(scene, camera)
}
