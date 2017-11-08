import * as THREE from 'three'
import * as CANNON from 'cannon'
import * as Howler from 'howler'
require('./OBJLoader.js')(THREE)
// require("./cannondebugrenderer.js")(THREE);
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
const gameOver = function() {
  themeSong.stop()
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
// var cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);

// INITIALIZE KEYBOARD CONTROLS
var keyboard = new THREEx.KeyboardState(renderer.domElement)
renderer.domElement.setAttribute('tabIndex', '0')
renderer.domElement.focus()

// CREATE CANNON.JS WORLD
function initCannon() {
  world = new CANNON.World()
  // world.gravity.set(0, 0, 0)
  world.broadphase = new CANNON.NaiveBroadphase()
  world.solver.iterations = 10

  // CREATE CANNON.JS METEORS
  const meteorShape = new CANNON.Box(new CANNON.Vec3(20, 20, 20))

  for (var i = 0; i < 100; i++) {
    cannonMeteor = new CANNON.Body({
      mass: 5,
      linearFactor: new CANNON.Vec3(0, 1, 0)
    })
    cannonMeteor.addShape(meteorShape)

    initMeteorPos.push(rand(-3, -1))
    cannonMeteor.velocity.set(0, 0, 0)
    cannonMeteor.position.set(rand(-1000, 1000), rand(500, 2000), 0)
    cannonMeteor.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0)
    // cannonMeteor.linearDamping = 0
    let q1 = new CANNON.Quaternion()
    q1.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI * 0.25)
    let q2 = new CANNON.Quaternion()
    q2.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI * 0.25)
    let q = q1.mult(q2)
    cannonMeteor.quaternion.set(q.x, q.y, q.z, q.w)

    world.addBody(cannonMeteor)
    cannonMeteors.push(cannonMeteor)
    // demo.addVisual(cannonMeteor)
  }

  const gemShape = new CANNON.Box(new CANNON.Vec3(10, 10, 10))

  for (var i = 0; i < 10; i++) {
    cannonGem = new CANNON.Body({
      mass: 2,
      linearFactor: new CANNON.Vec3(0, 1, 0)
    })
    cannonGem.addShape(gemShape)

    initMeteorPos.push(rand(-3, -1))
    cannonGem.velocity.set(0, 0, 0)
    cannonGem.position.set(rand(-1000, 1000), rand(500, 2000), 0)
    cannonGem.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0)
    // cannonGem.linearDamping = 0
    let q1 = new CANNON.Quaternion()
    q1.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI * 0.25)
    let q2 = new CANNON.Quaternion()
    q2.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI * 0.25)
    let q = q1.mult(q2)
    cannonGem.quaternion.set(q.x, q.y, q.z, q.w)

    world.addBody(cannonGem)
    cannonGems.push(cannonGem)
    // demo.addVisual(cannonMeteor)
  }
}

// CREATE THREE.JS METEORS
const meteorGeometry = new THREE.BoxGeometry(20, 20, 20)
const meteorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 })

cannonMeteors.forEach(particle => {
  const cube = new THREE.Mesh(meteorGeometry, meteorMaterial)
  scene.add(cube)
  threeMeteors.push(cube)
})

// CREATE THREE.JS GEMS
const gemGeometry = new THREE.BoxGeometry(10, 10, 10)
const gemMaterial = new THREE.MeshLambertMaterial({ color: 0xff00ff })

cannonGems.forEach(particle => {
  const cube = new THREE.Mesh(gemGeometry, gemMaterial)
  scene.add(cube)
  threeGems.push(cube)
})

// CREATE SHIP
// instantiate a loader
var loader = new THREE.OBJLoader()

// load a resource
loader.load(
  // resource URL
  'spaceship.obj',
  // called when resource is loaded
  function(threeShip) {
    threeShip.scale.set(0.05, 0.05, 0.05)
    threeShip.rotation.x = 6.3
    threeShip.rotation.z = 3.13
    threeShip.position.y = 10

    const shipNewMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
    // const shipBoundingBoxMaterial = new THREE.MeshBasicMaterial({
    //   color: 0xff00ff
    // })

    // threeShip.children[0].material = shipNewMaterial

    const cannonShip = mesh2shape(threeShip, { type: mesh2shape.Type.BOX })
    const shipBody = new CANNON.Body()
    shipBody.addShape(cannonShip)
    shipBody.position.y = 10

    world.addBody(shipBody)

    // ADD COLLIDE EVENT LISTENER
    shipBody.addEventListener('collide', e => {
      console.log('Skeppet krockade')
      // console.log(e.body)

      e.body.velocity.set(-500, 500, 500)
      crashSound.play()
      // lives--
    })

    updateFns.push(() => {
      //////////////////////////////////////////////////////////////////////////////////
      //		MOVE SPACESHIP								//
      //////////////////////////////////////////////////////////////////////////////////
      //MOVE TO THE LEFT
      if (keyboard.pressed('left')) {
        shipBody.position.x -= 3

        // // TILT LEFT
        // if (shipBody.rotation.y > -1) {
        //   shipBody.rotation.y -= 2 * delta;
        // }
        // MOVE TO THE RIGHT
      } else if (keyboard.pressed('right')) {
        shipBody.position.x += 3

        // TILT RIGHT
        // if (shipBody.rotation.y < 1) {
        //   shipBody.rotation.y += 2 * delta;
      } else if (keyboard.pressed('up')) {
        shipBody.position.y += 1
      } else if (keyboard.pressed('down')) {
        shipBody.position.y -= 1
      }
      // RESET LEFT TILT ON KEY UP
      // } else if (shipBody.rotation.y > 0.05) {
      //   shipBody.rotation.y -= 2 * delta;
      //   // RESET RIGHT TILT ON KEY UP
      // } else if (shipBody.rotation.y < 0) {
      //   shipBody.rotation.y += 2 * delta;
      // } else {
      //   shipBody.rotation.y = 0;
      // }

      threeShip.position.copy(shipBody.position)
      // object.rotation.copy(shipBody.rotation);
    })

    scene.add(threeShip)
  },
  // called when loading is in progresses
  function(xhr) {
    console.log(xhr.loaded / xhr.total * 100 + '% loaded')
  },
  // called when loading has errors
  function(error) {
    console.log('An error happened')
  }
)

function animate() {
  requestAnimationFrame(animate)
  updatePhysics()
  // cannonDebugRenderer.update();
  updateGrid()
  render()

  updateFns.forEach(fn => {
    fn()
  })

  score++
  scoreContent.textContent = `Score: ${score + bonus}`
  livesContent.textContent = `Lives: ${lives}`
}
animate()

function updatePhysics() {
  // Step the physics world
  world.step(timeStep)

  // COPY COORDINATES FROM CANNON.JS TO THREE.JS
  cannonMeteors.forEach((particle, index) => {
    threeMeteors[index].position.copy(particle.position)
    threeMeteors[index].quaternion.copy(particle.quaternion)
    particle.position.y += initMeteorPos[index] - score / 500

    if (particle.position.y < -10) {
      particle.position.set(rand(-1000, 1000), rand(2000, 3000), 0)
    }
  })

  cannonGems.forEach((particle, index) => {
    threeGems[index].position.copy(particle.position)
    threeGems[index].quaternion.copy(particle.quaternion)
    particle.position.y += initMeteorPos[index] - score / 500

    if (particle.position.y < -10) {
      particle.position.set(rand(-1000, 1000), rand(2000, 3000), 0)
    }
  })
}

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
