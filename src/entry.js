// TODO
// ✓ Skeppet ska inte kunna åka utanför skärmen
// ✓ Tilt på skeppet
// ✓ Shield/glow på skepp

// ✓ Rotation på meteorer
// - Använda modeller för meteorer
// ✓ Endast ett collide-event per krock!
// ✓ Håll kvar meteorer på z-axeln

// ✓ Explodera meteorer
// ✓ Explodera skepp
// ✓ Remove & dispose explosion pieces
// ✓ Skjuta sönder meteorer
// ✓ Ta bort shoot event listener

// - Intro
// - Outro
// - Pause?
// ✓ Övre limit på svårighetsgrad (= hastighet)

// - Code cleaning!

import * as THREE from 'three'
import * as CANNON from 'cannon'
import * as Howler from 'howler'
import mesh2shape from 'three-to-cannon'
import THREEx from './threex.js'
require('./OBJLoader.js')(THREE)
require('./cannondebugrenderer.js')(THREE, CANNON)

function rand(min, max) {
  return Math.random() * (max - min) + min
}

let world
let camera
let scene
let renderer
let updateFns = []

let cannonStorm = []
// let cannonMeteors = []
// let cannonGems = []
// let cannonExtraLives = []

let threeStorm = []

let initParticlePos = []
let timeStep = 1 / 60

let score = 0
let bonus = 0
let lives = 6

let countScore = false

let shotBody
let threeShotMesh

let regDetection = false
let displayShots = []
let threeShots = []
let cannonShots = []
let shootCount = 0

let introDone = false

// let particleStatus = {
//   metors: false,
//   gems: false,
//   extraLives: false
// }

// FILTER GROUPS
const SHIP = 1
const METEORS = 2
const SHOTS = 3
const GEMS = 4
const LIVES = 5

// ADD SOUND EFFECTS
const laserSound = new Howl({ src: 'laser.mp3' })
const bonusSound = new Howl({ src: 'bonus.wav' })
const lifeSound = new Howl({ src: 'life.wav' })
const crashSound = new Howl({ src: 'crash.wav' })
const dieSound = new Howl({ src: 'die.wav' })
const meteorExplosionSound = new Howl({ src: 'crash.wav' })
const music = new Howl({ src: 'meteor_storm_theme.mp3', volume: 0.3 })

music.play()

// ADD WELCOME SCREEN
const welcomeContainer = document.createElement('div')
welcomeContainer.classList.add('welcome')
document.body.appendChild(welcomeContainer)

// ADD LOGO
const logoContainer = document.createElement('div')
const logo = document.createTextNode('Meteor Storm')
logoContainer.appendChild(logo)
welcomeContainer.appendChild(logoContainer)

// ADD PLAY BUTTON
const playContainer = document.createElement('div')
playContainer.classList.add('play')
const playParagraph = document.createElement('p')
const play = document.createTextNode('Play')

playParagraph.appendChild(play)
playContainer.appendChild(playParagraph)
welcomeContainer.appendChild(playContainer)

// ADD COUNTER CONTAINER
const counterContainer = document.createElement('div')
counterContainer.classList.add('counters')
document.body.appendChild(counterContainer)

// ADD COUNTERS
function addCounter(counterName, counterText, variable) {
  const container = document.createElement('div')
  container.classList.add(counterName)
  let content = document.createTextNode(`${counterText}: ${score}`)
  container.appendChild(content)
  counterContainer.appendChild(container)
}

addCounter('score', 'Score', score)
addCounter('lives', 'Shield', lives)

// ADD GAME OVER SCREEN
const gameOverContainer = document.createElement('div')
gameOverContainer.classList.add('game-over', 'hide')
document.body.appendChild(gameOverContainer)

const playAgainContainer = document.createElement('div')
playAgainContainer.classList.add('play')

const gameOverParagraph = document.createElement('p')
gameOverParagraph.classList.add('large')
const gameOverText = document.createTextNode('Game Over')
gameOverParagraph.appendChild(gameOverText)
gameOverContainer.appendChild(gameOverParagraph)

const scoreParagraph = document.createElement('p')
let scoreText = document.createTextNode('Your Score:')
scoreParagraph.appendChild(scoreText)
gameOverContainer.appendChild(scoreParagraph)

const playAgainParagraph = document.createElement('p')
const playAgain = document.createTextNode('Play Again')
playAgainParagraph.appendChild(playAgain)
playAgainContainer.appendChild(playAgainParagraph)
gameOverContainer.appendChild(playAgainContainer)

// END GAME
function gameOver(shipBody, threeShip) {
  explode(3, 100, threeShip.position, 0xffffff)
  dieSound.play()
  world.removeBody(shipBody)
  scene.remove(threeShip)
  music.fade(0.5, 0, 1000)
  countScore = false

  gameOverContainer.classList.remove('hide')
  scoreText.nodeValue = `Your Score: ${score}`

  introDone = false
}

// START GAME
function gameStart(shipBody, threeShip, shipShield) {
  // MOVE SHIP FORWARD ON GAME START
  let playButtons = document.querySelectorAll('.play p')
  playButtons = Array.from(playButtons)
  playButtons.forEach(playButton =>
    playButton.addEventListener('click', e => {
      welcomeContainer.classList.add('hide')
      gameOverContainer.classList.add('hide')

      renderer.domElement.focus()

      if (!scene.getObjectByName('Ship')) {
        world.addBody(shipBody)
        scene.add(threeShip)
        scene.add(shipShield)

        score = 0
        lives = 6

        displayShots.forEach(shot => {
          shot.visible = true
          shootCount = 0
        })

        shipBody.position.set(0, -100, 0)
        threeShip.position.set(0, -100, 0)
        shipShield.position.set(0, -100, 0)

        shipShield.material.uniforms.glowColor.value.set(0xffea37)
      }

      if (cannonStorm.length === 0) {
        // CREATE 100 CANNON.JS METEORS
        makeStormParticles('meteor', 'Meteor')

        // CREATE 10 CANNON.JS GEMS
        makeStormParticles(
          'gem', // Shape
          'Gem', // Name
          10, // Number
          2, // Mass
          GEMS, // Collision filter group
          SHIP // Collision filter mask
        )

        // CREATE 2 CANNON.JS EXTRA LIVES
        makeStormParticles(
          'extraLife', // Shape
          'ExtraLife', // Name
          2, // Number
          2, // Mass
          LIVES, // Collision filter group
          SHIP // Collision filter mask
        )
      }

      placeStormParticles('Meteor')

      placeStormParticles(
        'Gem', // Name
        [-3, -1], // Speed
        [-700, 700], // X position
        [2000, 3000], // Y position
        [-0.3, 0.3], // X velocity
        [-300, 100], // Y velocity
        [-20, 20], // Impulse force
        [-30, 30] // Impulse point
      )

      placeStormParticles(
        'ExtraLife', // Name
        [-3, -1], // Speed
        [-300, 300], // X position
        [2000, 3000], // Y position
        [-0.3, 0.3], // X velocity
        [-300, 100], // Y velocity
        [-20, 20], // Impulse force
        [-30, 30] // Impulse point
      )

      if (threeStorm.length === 0) {
        // CREATE THREE.JS STORM PARTICLES
        const meteorGeometry = new THREE.BoxGeometry(20, 20, 20)
        const meteorMaterial = new THREE.MeshLambertMaterial({
          color: 0x444444
        })

        const gemGeometry = new THREE.IcosahedronGeometry(10)
        const gemMaterial = new THREE.MeshLambertMaterial({ color: 0xffea49 })

        const extraLifeGeometry = new THREE.IcosahedronGeometry(10)
        const extraLifeMaterial = new THREE.MeshLambertMaterial({
          color: 0xf189f7
        })

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
      }

      updateFns.push(() => {
        if (!introDone) {
          setTimeout(() => {
            if (shipBody.position.y < 11) {
              shipBody.position.y += 1
              threeShip.position.y += 1
              if (shipBody.position.y === 10) {
                introDone = true
              }
            }
          }, 200)
        }
      })
      // move ship to game position
      // run meteor function
      // run gem function
      // run extra lives function

      countScore = true

      // console.log(cannonStorm, threeStorm)
    })
  )
}

// CREATE THREE SCENE
scene = new THREE.Scene()

initCannon()

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

// // ADD AMMO COUNTER
displayShotsLeft()

setInterval(() => {
  displayShots.forEach(shot => {
    shot.visible = true
  })
  shootCount = 0
}, 1000 * 10)

function displayShotsLeft() {
  const displayShotGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2)
  const displayShotMaterial = new THREE.MeshLambertMaterial({
    color: 0x4ef7da
  })

  let incrementPos = 0
  for (let i = 0; i < 10; i++) {
    const cube = new THREE.Mesh(displayShotGeometry, displayShotMaterial)
    cube.position.set(-8 + incrementPos, -15, 110)
    incrementPos += 2
    displayShots.push(cube)
    scene.add(cube)
  }
}

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

// PLACE EXPLOSION IN FRONT OF SHIP
function explode(size, count, explosionPos, color) {
  const explosionParticleGeometry = new THREE.TetrahedronGeometry(size)
  let explosion = new THREE.Group()
  let explosionParticles = []

  for (let i = 0; i < count; i++) {
    const explosionParticleMaterial = new THREE.MeshLambertMaterial({
      color: color,
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
  name,
  number = 100,
  mass = 5,
  collisionFilterGroup = METEORS,
  collisionFilterMask = SHIP | SHOTS
  // speed = [-3, -1],
  // positionX = [-1000, 1000],
  // positionY = [2000, 3000],
  // velocityX = [-0.3, 0.3],
  // velocityY = [-300, 100],
  // impulseForce = [-50, 50],
  // impulsePoint = [-30, 30]
) {
  // console.log('makeStormParticles')

  // if (
  //   particleStatus.meteors === false ||
  //   particleStatus.gems === false ||
  //   particleStatus.extraLives === false
  // ) {
  //   // console.log('New particles')

  switch (shape) {
    case 'meteor':
      shape = new CANNON.Box(new CANNON.Vec3(10, 10, 10))
      // particleStatus.meteors = true
      break
    case 'gem':
      shape = new CANNON.Sphere(10)
      // particleStatus.gems = true
      break
    case 'extraLife':
      shape = new CANNON.Sphere(10)
      // particleStatus.extraLives = true
      break
  }

  let cannonStormParticle

  for (var i = 0; i < number; i++) {
    cannonStormParticle = new CANNON.Body({
      mass: mass,
      collisionFilterGroup: collisionFilterGroup,
      collisionFilterMask: collisionFilterMask
    })
    cannonStormParticle.addShape(shape)

    // GIVE STORM PARTICLE A NAME
    cannonStormParticle.name = name

    // placeParticles(cannonStormParticle)

    world.addBody(cannonStormParticle)
    cannonStorm.push(cannonStormParticle)

    // if ((cannonStormParticle.name = 'Meteor')) {
    //   cannonMeteors.push(cannonStormParticle)
  }
  //
  // if ((cannonStormParticle.name = 'Gem')) {
  //   cannonGems.push(cannonStormParticle)
  // }
  //
  // if ((cannonStormParticle.name = 'ExtraLife')) {
  //   cannonExtraLives.push(cannonStormParticle)
  // }

  // switch (shape) {
  //   case 'meteor':
  //     cannonMeteors.push(cannonStormParticle)
  //     break
  //   case 'gem':
  //     cannonGems.push(cannonStormParticle)
  //     break
  //   case 'extraLife':
  //     cannonExtraLives.push(cannonStormParticle)
  //     break
  // }
  // }
  // } else {
  //   // console.log('Old particles')
  //   // console.log(cannonMeteors)
  //   // cannonMeteors.forEach(cannonStormParticle => {
  //   //   placeParticles(cannonStormParticle)
  //   // })
  //   // cannonGems.forEach(cannonStormParticle => {
  //   //   placeParticles(cannonStormParticle)
  //   // })
  //   // cannonExtraLives.forEach(cannonStormParticle => {
  //   //   placeParticles(cannonStormParticle)
  //   // })
  // }
}

function placeStormParticles(
  name,
  speed = [-3, -1],
  positionX = [-1000, 1000],
  positionY = [2000, 3000],
  velocityX = [-0.3, 0.3],
  velocityY = [-300, 100],
  impulseForce = [-50, 50],
  impulsePoint = [-30, 30]
) {
  const particles = cannonStorm.filter(particle => particle.name === name)

  particles.forEach(cannonStormParticle => {
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
      new CANNON.Vec3(
        rand(impulseForce[0], impulseForce[1]),
        rand(impulseForce[0], impulseForce[1]),
        rand(impulseForce[0], impulseForce[1])
      ),
      new CANNON.Vec3(
        rand(impulsePoint[0], impulsePoint[1]),
        rand(impulsePoint[0], impulsePoint[1]),
        rand(impulsePoint[0], impulsePoint[1])
      )
    )
  })
}

// CREATE CANNON.JS WORLD
function initCannon() {
  world = new CANNON.World()
  world.broadphase = new CANNON.NaiveBroadphase()
  world.solver.iterations = 10
} // Close initCannon()

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
    threeShip.position.y = -100

    threeShip.traverse(function(node) {
      const basicMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
      if (node.geometry) {
        node.material.side = THREE.FrontSide
        node.material = basicMaterial
      }
    })

    threeShip.name = 'Ship'

    // ADD SHIELD
    const shieldGeometry = new THREE.SphereGeometry(25, 32, 32)
    const shieldMaterial = THREEx.createAtmosphereMaterial()
    const shipShield = new THREE.Mesh(shieldGeometry, shieldMaterial)
    shipShield.position.y = -100

    shieldMaterial.uniforms.glowColor.value.set(0xffea37)
    shieldMaterial.uniforms.coeficient.value = 1.2
    shieldMaterial.uniforms.power.value = 2.8
    scene.add(shipShield)

    const cannonShip = mesh2shape(threeShip, { type: mesh2shape.Type.SPHERE })
    cannonShip.radius = 10
    const shipBody = new CANNON.Body()
    shipBody.addShape(cannonShip)
    shipBody.position.y = -100

    world.addBody(shipBody)

    gameStart(shipBody, threeShip, shipShield)

    // ADD COLLIDE EVENT LISTENER
    shipBody.addEventListener('collide', e => {
      if (e.body.name === 'Meteor') {
        if (lives > 0) {
          if (!shieldMaterial) {
            scene.add(shipShield)
          }
          lives--
          explode(2, 75, e.target.position, 0x777777)
          crashSound.play()
          e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0)
        }
      }

      if (e.body.name === 'Gem') {
        bonus += 5000
        bonusSound.play()
        e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0)
      }

      if (e.body.name === 'ExtraLife') {
        if (lives < 6) {
          lives++
        } else {
          bonus += 7000
        }
        lifeSound.play()
        e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0)
      }

      if (lives === 6) {
        shieldMaterial.uniforms.glowColor.value.set(0xffea37)
      }

      if (lives === 5) {
        shieldMaterial.uniforms.glowColor.value.set(0x47ad9c)
      }

      if (lives === 4) {
        shieldMaterial.uniforms.glowColor.value.set(0xf189f7)
      }

      if (lives === 3) {
        shieldMaterial.uniforms.glowColor.value.set(0xffffff)
      }

      if (lives === 2) {
        scene.add(shipShield)
        shieldMaterial.uniforms.glowColor.value.set(0x676a6c)
      }

      if (lives === 1) {
        scene.remove(shipShield)
      }

      if (lives === 0) {
        gameOver(shipBody, threeShip, shipShield)
      }
    })

    // SHOOTING
    let fired = false
    window.addEventListener('keydown', function fire(e) {
      if (!fired && e.keyCode === 32 && shootCount < 10) {
        fired = true

        laserSound.play()

        // CREATE CANNON SHOT
        // var gunShot = new CANNON.Cylinder(1, 1, 25, 32)
        const gunShot = new CANNON.Sphere(2)
        const threeShotGroup = new THREE.Group()
        let cannonShotGroup = {}
        cannonShotGroup.children = []

        for (var i = 0; i < 2; i++) {
          shotBody = new CANNON.Body({
            mass: 5,
            linearFactor: new CANNON.Vec3(1, 1, 1),
            collisionFilterGroup: SHOTS,
            collisionFilterMask: METEORS
          })

          shotBody.name = 'Shot'

          if (i === 0) {
            shotBody.position.x = shipBody.position.x - 2.5
          } else {
            shotBody.position.x = shipBody.position.x + 2.5
          }

          shotBody.position.y = shipBody.position.y + 25
          shotBody.position.z = shipBody.position.z
          shotBody.velocity.set(0, 500, 0)
          shotBody.addShape(gunShot)
          cannonShotGroup.children.push(shotBody)
          world.addBody(shotBody)

          shotBody.addEventListener('collide', e => {
            const currentCube = e.body
            meteorExplosionSound.play()
            currentCube.position.set(rand(-1000, 1000), rand(1000, 2000), 0)

            explode(4, 10, e.target.position, 0x777777)

            currentCube.applyLocalImpulse(
              new CANNON.Vec3(0, 0, 0),
              new CANNON.Vec3(0, 0, 0)
            )

            threeShots.forEach((shot, index) => {
              scene.remove(shot)
              world.removeBody(cannonShots[index].children[0])
              world.removeBody(cannonShots[index].children[1])
              threeShots.splice(index, 1)

              cannonShots.splice(index, 1)
            })
          })

          // THREE LASER BEAM
          const laserBeam = new THREEx.LaserBeam()
          laserBeam.object3d.scale.set(40, 40, 40)
          // laserBeam.object3d.position.set(0, 50, 0)
          laserBeam.object3d.rotation.set(0, 1.57, 1.58)
          laserBeam.object3d.position.y = shotBody.position.y
          laserBeam.object3d.position.x = shotBody.position.x
          threeShotGroup.add(laserBeam.object3d)
        }

        scene.add(threeShotGroup)
        threeShots.push(threeShotGroup)
        cannonShots.push(cannonShotGroup)

        //UPDATE SHOTS LEFT DISPLAY
        displayShots[displayShots.length - 1 - shootCount].visible = false

        if (shootCount < 10) {
          shootCount++
        }
      }

      // PREVENT MULTIPLE SHOTS ON KEYDOWN
      window.addEventListener('keyup', e => {
        fired = false
      })

      // if (lives === 0) {
      //   window.removeEventListener('keydown', fire)
      // }
    }) // End shooting

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
      shipShield.position.copy(shipBody.position)
      shipShield.rotation.copy(threeShip.rotation)

      // REMOVE SHOT
      if (shotBody) {
        threeShots.forEach((shot, index) => {
          let shotNum = index
          shot.position.y = cannonShots[index].children[0].position.y - 70
          if (shot.position.y > 300) {
            // shot.children[0].material.transparent = true;
            // shot.children[1].material.transparent = true;
            // shot.children[0].material.opacity -= 0.05;
            // shot.children[1].material.opacity -= 0.05;

            scene.remove(shot)

            world.removeBody(cannonShots[index].children[0])
            world.removeBody(cannonShots[index].children[1])

            threeShots.splice(index, 1)
            cannonShots.splice(index, 1)

            // if (shot.children[1].material.opacity < 0.1) {
            //   scene.remove(shot);
            //
            //   console.log(cannonShots);
            //   world.removeBody(cannonShots[index].children[0]);
            //   world.removeBody(cannonShots[index].children[1]);
            //
            //   threeShots.splice(index, 1);
            //   cannonShots.splice(index, 1);
            // }
          }
        })
      }
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
  cannonDebugRenderer.update()

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
  cannonDebugRenderer.update()

  // STEP THE PHYSICS WORLD
  world.step(timeStep)

  // COPY COORDINATES FROM CANNON.JS TO THREE.JS
  cannonStorm.forEach((particle, index) => {
    threeStorm[index].position.copy(particle.position)

    let acceleration = initParticlePos[index] - score / 750
    let speedLimit = -12

    if (acceleration > speedLimit) {
      particle.position.y += acceleration
    } else {
      particle.position.y += speedLimit
    }

    // STOP PARTICLE FROM MOVING ON Z-AXIS
    particle.position.z = 0

    threeStorm[index].quaternion.copy(particle.quaternion)

    if (lives > 0) {
      // PUT PARTICLE BACK IN STORM
      if (
        particle.position.y < -10 ||
        particle.position.x > 1000 ||
        particle.position.x < -1000
      ) {
        if (particle.name === 'Gem') {
          particle.position.set(rand(-700, 700), rand(1000, 2000), 0)
        } else if (particle.name === 'ExtraLife') {
          particle.position.set(rand(-300, 300), rand(1000, 2000), 0)
        } else {
          particle.position.set(rand(-1000, 1000), rand(1000, 2000), 0)
        }
        particle.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0)
      }
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
  if (countScore === true) {
    score++
    document.querySelector('.score').textContent = `Score: ${score + bonus}`
  }
}

// UPDATE LIVES COUNTER
function updateLives() {
  if (lives > 0) {
    document.querySelector('.lives').textContent = `Shield: ${lives - 1}`
  }
}

function render() {
  renderer.render(scene, camera)
}
