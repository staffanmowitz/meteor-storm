'use strict'

import * as THREE from 'three'

require('./threejs/physijs/physi')(THREE)

Physijs.scripts.worker = 'physijs_worker.js'
Physijs.scripts.ammo = 'ammo.js'

const randomNumber = function(min, max) {
  return Math.random() * (max - min) + min
}

// const _boxes = []
let renderer
let scene
let camera

const initScene = function() {
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  // renderer.shadowMap.enabled = true
  // renderer.shadowMapSoft = true
  document.body.appendChild(renderer.domElement)

  scene = new Physijs.Scene()
  scene.setGravity(new THREE.Vector3(0, -30, 0))
  scene.addEventListener('update', function() {
    scene.simulate(undefined, 1)
  })

  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    1000
  )
  camera.position.set(60, 50, 60)
  camera.lookAt(scene.position)
  scene.add(camera)

  // Set lighting for the scene
  const pointLight = new THREE.PointLight(0xffffff)
  pointLight.position.set(10, 50, 130)
  scene.add(pointLight)

  const ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.3)
  scene.add(ambientLight)

  // Ground
  const ground_material = Physijs.createMaterial(
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    0.8, // high friction
    0.3 // low restitution
  )

  const ground = new Physijs.BoxMesh(
    new THREE.BoxGeometry(100, 1, 100),
    ground_material,
    0 // mass
  )
  ground.receiveShadow = true
  scene.add(ground)

  makeStorm()

  requestAnimationFrame(render)
  scene.simulate()
}

const makeStorm = (function() {
  const meteorGeometry = new THREE.BoxGeometry(4, 4, 4)
  const handleCollision = function(
    collided_with,
    linearVelocity,
    angularVelocity
  ) {
    console.log('Krock')
  }
  const createMeteor = function() {
    const meteorMaterial = Physijs.createMaterial(
      new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
      0.6, // medium friction
      0.3 // low restitution
    )

    const meteor = new Physijs.BoxMesh(meteorGeometry, meteorMaterial)
    meteor.collisions = 0

    meteor.position.set(Math.random() * 15 - 7.5, 25, Math.random() * 15 - 7.5)

    meteor.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    )

    meteor.addEventListener('collision', handleCollision)
    meteor.addEventListener('ready', makeStorm)
    scene.add(meteor)
  }

  return function() {
    setTimeout(createMeteor, 1000)
  }
})()

const render = function() {
  requestAnimationFrame(render)
  renderer.render(scene, camera)
}

initScene()
