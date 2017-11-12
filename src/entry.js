// TODO
// ✓ Skeppet ska inte kunna åka utanför skärmen
// ✓ Tilt på skeppet
// - Shield/glow på skepp

// ✓ Rotation på meteorer
// - Använda modeller för meteorer
// ✓ Endast ett collide-event per krock!
// ✓ Håll kvar meteorer på z-axeln

// ✓ Explodera meteorer
// - Explodera skepp
// ✓ Remove & dispose explosion pieces
// - Skjuta sönder meteorer

// - Intro
// - Outro
// - Pause?
// - Övre limit på svårighetsgrad (= hastighet)

// - Code cleaning!

import * as THREE from 'three'
import * as CANNON from 'cannon'
import * as Howler from 'howler'
import mesh2shape from 'three-to-cannon'
import THREEx from './threex.js'
require('./OBJLoader.js')(THREE)
// require('./cannondebugrenderer.js')(THREE, CANNON)

function rand(min, max) {
  return Math.random() * (max - min) + min
}

let world
let camera
let scene
let renderer
let updateFns = []

let cannonStorm = []
let threeStorm = []

let initParticlePos = []
var timeStep = 1 / 60

let score = 0
let bonus = 0
let lives = 5

// ADD SOUND EFFECTS
const bonusSound = new Howl({ src: 'bonus.wav' })
const lifeSound = new Howl({ src: 'life.wav' })
const crashSound = new Howl({ src: 'crash.wav' })
const dieSound = new Howl({ src: 'die.wav' })
const music = new Howl({ src: 'highway-slaughter.mp3', volume: 0.3 })

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
function gameOver(shipBody, threeShip) {
  world.removeBody(shipBody)
  scene.remove(threeShip)
  dieSound.play()
  music.fade(0.5, 0, 1000)
  const gameOverContainer = document.createElement('div')
  gameOverContainer.classList.add('game-over')
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
// var cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world)

// INITIALIZE KEYBOARD CONTROLS
var keyboard = new THREEx.KeyboardState(renderer.domElement)
renderer.domElement.setAttribute('tabIndex', '0')
renderer.domElement.focus()

// EXPLOSION
const explosionParticleGeometry = new THREE.TetrahedronGeometry(2)

// PLACE EXPLOSION IN FRONT OF SHIP
function explode(explosionPos) {
  let explosion = new THREE.Group()
  let explosionParticles = []

  for (let i = 0; i < 100; i++) {
    const explosionParticleMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      opacity: 1,
      transparent: true
    })

    explosionParticles[i] = new THREE.Mesh(
      explosionParticleGeometry,
      explosionParticleMaterial,
      0
    )

    explosionParticles[i].position.set(explosionPos.x, explosionPos.y + 30, 0)
    explosionParticles[i].rotationValueX = rand(-0.2, 0.2)
    explosionParticles[i].rotationValueY = rand(-0.2, 0.2)
    explosionParticles[i].velocity = new THREE.Vector3(
      rand(-2, 2),
      rand(-2, 1),
      rand(-2, 2)
    )
    explosion.add(explosionParticles[i])
  }

  scene.add(explosion)

  // ANIMATE EXPLOSION PARTICLES
  updateFns.push(() => {
    explosion.children.forEach(particle => {
      particle.rotation.x += particle.rotationValueX
      particle.rotation.y += particle.rotationValueY
      particle.position.y -= particle.velocity.y
      particle.position.x -= particle.velocity.x
      particle.position.z -= particle.velocity.z
      particle.material.opacity -= 0.003
    })
  })

  // REMOVE AND DISPOSE EXPLOSION PARTICLES AFTER 5 SECONDS
  setTimeout(function() {
    explosion.children.forEach(particle => {
      scene.remove(particle)
      // particle.dispose()
      particle.geometry.dispose()
      particle.material.dispose()
      // particle.texture.dispose()
    })
    scene.remove(explosion)
  }, 6000)
}

function makeStormParticles(
  shape,
  number,
  mass,
  name,
  speed,
  positionX,
  positionY,
  velocityX,
  velocityY
) {
  let cannonStormParticle

  for (var i = 0; i < number; i++) {
    cannonStormParticle = new CANNON.Body({
      mass: mass
    })
    cannonStormParticle.addShape(shape)

    // GIVE STORM PARTICLE A NAME
    cannonStormParticle.name = name

    // PLACE STORM PARTICLES RANDOMLY ON CANVAS AND GIVE THEM RANDOM VELOCITY
    initParticlePos.push(rand(speed[0], speed[1]))
    cannonStormParticle.position.set(
      rand(positionX[0], positionX[1]),
      rand(positionY[0], positionY[1]),
      0
    )
    cannonStormParticle.velocity.set(
      rand(velocityX[0], velocityX[1]),
      rand(velocityY[0], velocityX[1]),
      0
    )

    // APPLY RANDOM FORCE TO ROTATE BODY
    cannonStormParticle.applyLocalImpulse(
      new CANNON.Vec3(rand(-50, 50), rand(-50, 50), rand(-50, 50)),
      new CANNON.Vec3(rand(-30, 30), rand(-30, 30), rand(-30, 30))
    )

    world.addBody(cannonStormParticle)
    cannonStorm.push(cannonStormParticle)
  }
}

// CREATE CANNON.JS WORLD
function initCannon() {
  world = new CANNON.World()
  world.broadphase = new CANNON.NaiveBroadphase()
  world.solver.iterations = 10

  // CREATE 100 CANNON.JS METEORS
  const meteorShape = new CANNON.Box(new CANNON.Vec3(10, 10, 10))
  makeStormParticles(
    meteorShape,
    100,
    5,
    'Meteor',
    [-3, -1],
    [-1000, 1000],
    [500, 2000],
    [-0.3, 0.3],
    [-300, 100],
    [-50, 50],
    [-30, 30]
  )

  // CREATE 10 CANNON.JS GEMS
  const gemShape = new CANNON.Sphere(10)
  makeStormParticles(
    gemShape,
    10,
    2,
    'Gem',
    [-3, -1],
    [-700, 700],
    [500, 2000],
    [-0.3, 0.3],
    [-300, 100],
    [-20, 20],
    [-30, 30]
  )

  // CREATE 2 CANNON.JS EXTRA LIVES
  const extraLifeShape = new CANNON.Sphere(10)
  makeStormParticles(
    extraLifeShape,
    2,
    2,
    'ExtraLife',
    [-3, -1],
    [-700, 700],
    [500, 2000],
    [-0.3, 0.3],
    [-300, 100],
    [-20, 20],
    [-30, 30]
  )
} // Close initCannon()

// CREATE THREE.JS STORM PARTICLES
const meteorGeometry = new THREE.BoxGeometry(20, 20, 20)
const meteorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 })

const gemGeometry = new THREE.IcosahedronGeometry(10)
const gemMaterial = new THREE.MeshLambertMaterial({ color: 0xffea49 })

const extraLifeGeometry = new THREE.IcosahedronGeometry(10)
const extraLifeMaterial = new THREE.MeshLambertMaterial({ color: 0xf189f7 })

cannonStorm.forEach(particle => {
  let particleMesh

  if (particle.name === 'Meteor') {
    particleMesh = new THREE.Mesh(meteorGeometry, meteorMaterial)
  }

  if (particle.name === 'Gem') {
    particleMesh = new THREE.Mesh(gemGeometry, gemMaterial)
  }

  if (particle.name === 'ExtraLife') {
    particleMesh = new THREE.Mesh(extraLifeGeometry, extraLifeMaterial)
  }

  scene.add(particleMesh)
  threeStorm.push(particleMesh)
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

    threeShip.traverse(function(node) {
      const basicMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
      if (node.geometry) {
        node.material.side = THREE.FrontSide
        node.material = basicMaterial
      }
    })

    // let geometry = new THREE.Geometry().fromBufferGeometry(
    //   threeShip.children[0].geometry
    // )
    //
    // threeShip.geometry = geometry
    //
    // // create the mesh for the halo with AtmosphereMaterial
    // var shieldGeometry = threeShip.geometry.clone()
    // THREEx.dilateGeometry(geometry, 0.5)
    // var shieldMaterial = THREEx.createAtmosphereMaterial()
    // var shipShield = new THREE.Mesh(shieldGeometry, shieldMaterial)
    // shipShield.scale.set(0.06, 0.06, 0.06)
    // shipShield.rotation.x = 6.3
    // shipShield.rotation.z = 3.13
    // shipShield.position.y = 10
    // scene.add(shipShield)

    // console.log(shipShield)

    // possible customisation of AtmosphereMaterial
    // shieldMaterial.uniforms.glowColor.value = new THREE.Color('#4ef7da')
    // shieldMaterial.uniforms.coeficient.value = 0.4
    // shieldMaterial.uniforms.power.value = 0.6

    // console.log(geometry)

    // console.log(threeShip)

    // var glowMesh = new THREEx.GeometricGlowMesh(threeShip)
    //
    // glowMesh.outsideMesh.material.uniforms.glowColor.value.set('hotpink')
    // glowMesh.outsideMesh.material.uniforms.coeficient.value = 0.5
    // glowMesh.outsideMesh.material.uniforms.power.value = 1.2

    // glowMesh.insideMesh.material.uniforms.glowColor.value.set('hotpink')
    // glowMesh.insideMesh.material.uniforms.coeficient.value = 1.1
    // glowMesh.insideMesh.material.uniforms.power.value = 1.4

    // console.log(glowMesh)
    // threeShip.add(glowMesh.object3d)
    // console.log(threeShip)

    const cannonShip = mesh2shape(threeShip, { type: mesh2shape.Type.SPHERE })
    cannonShip.radius = 10
    const shipBody = new CANNON.Body()
    shipBody.addShape(cannonShip)
    shipBody.position.y = 10

    world.addBody(shipBody)

    // ADD COLLIDE EVENT LISTENER
    shipBody.addEventListener('collide', e => {
      // console.log('Skeppet krockade med ' + e.body.name)

      if (e.body.name === 'Meteor') {
        if (lives > 0) {
          lives--
          explode(e.target.position)
          crashSound.play()
          // e.body.velocity.set(-500, 500, 500)
          e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0)
        }

        if (lives === 0) {
          // lives = 0
          gameOver(shipBody, threeShip)
        }
      }

      if (e.body.name === 'Gem') {
        bonus += 5000
        bonusSound.play()
        e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0)
      }

      if (e.body.name === 'ExtraLife') {
        lives++
        lifeSound.play()
        e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0)
      }
    })

    // MOVE SPACESHIP
    updateFns.push(() => {
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
      // shipShield.position.copy(shipBody.position)
      // shipShield.rotation.copy(threeShip.rotation)
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
  // cannonDebugRenderer.update()

  updatePhysics()
  updateGrid()
  updateScore()
  updateLives()

  render()

  updateFns.forEach(fn => {
    fn()
  })
}
animate()

function updatePhysics() {
  // cannonDebugRenderer.update()

  // STEP THE PHYSICS WORLD
  world.step(timeStep)

  // COPY COORDINATES FROM CANNON.JS TO THREE.JS
  cannonStorm.forEach((particle, index) => {
    threeStorm[index].position.copy(particle.position)
    particle.position.y += initParticlePos[index] - score / 750

    // STOP PARTICLE FROM MOVING ON Z-AXIS
    particle.position.z = 0

    threeStorm[index].quaternion.copy(particle.quaternion)

    // PUT PARTICLE BACK IN STORM
    if (
      particle.position.y < -10 ||
      particle.position.x > 1000 ||
      particle.position.x < -1000
    ) {
      if (particle.name === 'Gem' || particle.name === 'ExtraLife') {
        particle.position.set(rand(-700, 700), rand(1000, 2000), 0)
      } else {
        particle.position.set(rand(-1000, 1000), rand(1000, 2000), 0)
      }
      particle.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0)
    }
  })
}

// MOVE BACKGROUND GRID
function updateGrid() {
  gridX.forEach(line => {
    if (line.position.y < 0) {
      line.position.y = 2000
    }
    line.position.y -= 2
  })
}

// UPDATE SCORE COUNTER
function updateScore() {
  if (lives > 0) {
    score++
    scoreContent.textContent = `Score: ${score + bonus}`
  }
}

// UPDATE LIVES COUNTER
function updateLives() {
  livesContent.textContent = `Lives: ${lives}`
}

function render() {
  renderer.render(scene, camera)
}
