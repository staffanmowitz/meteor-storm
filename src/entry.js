import * as THREE from "three";
import * as CANNON from "cannon";
require("./OBJLoader.js")(THREE);
// require("./cannondebugrenderer.js")(THREE);
const mesh2shape = require("three-to-cannon");
import THREEx from "./threex.keyboardstate";

var world,
  mass,
  body,
  shape,
  camera,
  scene,
  renderer,
  geometry,
  material,
  material2,
  mesh,
  mesh2,
  b1;

let updateFns = [];
let cannonParticles = [];
let threeParticles = [];
let initMeteorPos = [];
let score = 0;
var timeStep = 1 / 60;

// initThree();
initCannon();

// function initThree() {
scene = new THREE.Scene();

// var gridHelper = new THREE.GridHelper(1000, 100, 0x00ff00, 0x00ff00);
// scene.add(gridHelper);

camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, -70, 100);
camera.rotation.set(20, 0, 0);

scene.add(camera);
// SET LIGHTING FOR THE SCENE
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(10, 50, 130);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.3);
scene.add(ambientLight);

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

// GRID
let ackY = 0;
let ackX = -1000;
let gridX = [];
for (var i = 0; i < 40; i++) {
  var lineMaterial = new THREE.LineBasicMaterial({
    color: 0x4ef7da,
    blending: THREE.AdditiveBlending
  });

  var lineXGeometry = new THREE.Geometry();
  lineXGeometry.vertices.push(new THREE.Vector3(-1000, 0, -30));
  lineXGeometry.vertices.push(new THREE.Vector3(1000, 0, -30));

  var lineX = new THREE.Line(lineXGeometry, lineMaterial);
  console.log(lineX);
  lineX.position.y = ackY;
  ackY += 100;
  gridX.push(lineX);
  scene.add(lineX);

  var lineYGeometry = new THREE.Geometry();
  lineYGeometry.vertices.push(new THREE.Vector3(0, -100, -30));
  lineYGeometry.vertices.push(new THREE.Vector3(0, 2000, -30));

  var lineY = new THREE.Line(lineYGeometry, lineMaterial);

  lineY.position.x = ackX;
  ackX += 50;

  scene.add(lineY);
}

// INITIALIZE CANNON DEBUG RENDERER
// var cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);
// INITIALIZE KEYBOARD CONTROLS
var keyboard = new THREEx.KeyboardState(renderer.domElement);
renderer.domElement.setAttribute("tabIndex", "0");
renderer.domElement.focus();

//////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////

// } //end of init three function

function initCannon() {
  world = new CANNON.World();
  world.gravity.set(0, 0, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  shape = new CANNON.Box(new CANNON.Vec3(5, 5, 5));

  mass = 1;
  body = new CANNON.Body({
    mass: 1
  });
  body.addShape(shape);
  body.position.set(0, -2, 0);
  body.velocity.set(0, 0, 0);
  body.angularVelocity.set(5, 10, 1);
  body.angularDamping = 0.5;
  world.addBody(body);

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  var boxShape = new CANNON.Box(new CANNON.Vec3(20, 20, 20));

  for (var i = 0; i < 20; i++) {
    b1 = new CANNON.Body({ mass: 5, linearFactor: new CANNON.Vec3(0, 1, 0) });
    b1.addShape(boxShape);

    initMeteorPos.push(rand(-3, -1));
    b1.velocity.set(0, 0, 0);
    b1.position.set(rand(-1000, 1000), rand(500, 2000), 0);
    b1.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0);
    b1.linearDamping = 0;
    var q1 = new CANNON.Quaternion();
    q1.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI * 0.25);
    var q2 = new CANNON.Quaternion();
    q2.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI * 0.25);
    var q = q1.mult(q2);
    b1.quaternion.set(q.x, q.y, q.z, q.w);
    // b1.quaternion.set(q.x, q.y, q.z, q.w);

    world.addBody(b1);
    cannonParticles.push(b1);
    // demo.addVisual(b1);
  }
}

// instantiate a loader
var loader = new THREE.OBJLoader();

// load a resource
loader.load(
  // resource URL
  "spaceship.obj",
  // called when resource is loaded
  function(object) {
    object.scale.set(0.05, 0.05, 0.05);
    object.rotation.x = 6;
    object.rotation.z = 3.13;
    object.position.x = 0;
    object.position.y = 10;
    const shipNewMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const shipBoundingBoxMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff
    });

    object.children[0].material = shipNewMaterial;
    const cannonShip = mesh2shape(object, { type: mesh2shape.Type.BOX });
    console.log(cannonShip);
    const shipBody = new CANNON.Body({
      mass: 2000
    });
    shipBody.addShape(cannonShip);
    world.addBody(shipBody);

    shipBody.shapes[0].material = shipBoundingBoxMaterial;

    shipBody.addEventListener("collide", e => {
      console.log(e);
      console.log("skeppet krockade");
      object.children[0].material.color.set(0x00ff00);
      score += 1;
      e.target.position.x = 10;
      console.log(score);
    });

    updateFns.push(() => {
      //////////////////////////////////////////////////////////////////////////////////
      //		MOVE SPACESHIP								//
      //////////////////////////////////////////////////////////////////////////////////
      //MOVE TO THE LEFT
      if (keyboard.pressed("left")) {
        shipBody.position.x -= 3;

        // // TILT LEFT
        // if (shipBody.rotation.y > -1) {
        //   shipBody.rotation.y -= 2 * delta;
        // }
        // MOVE TO THE RIGHT
      } else if (keyboard.pressed("right")) {
        shipBody.position.x += 3;

        // TILT RIGHT
        // if (shipBody.rotation.y < 1) {
        //   shipBody.rotation.y += 2 * delta;
      } else if (keyboard.pressed("up")) {
        shipBody.position.y += 1;
      } else if (keyboard.pressed("down")) {
        shipBody.position.y -= 1;
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

      object.position.copy(shipBody.position);
      // object.rotation.copy(shipBody.rotation);
    });

    scene.add(object);
  },
  // called when loading is in progresses
  function(xhr) {
    console.log(xhr.loaded / xhr.total * 100 + "% loaded");
  },
  // called when loading has errors
  function(error) {
    console.log("An error happened");
  }
);
// CREATE THREE PARTICLES
geometry = new THREE.BoxGeometry(20, 20, 20);
material = new THREE.MeshLambertMaterial({ color: 0xff00ff });

cannonParticles.forEach(particle => {
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  threeParticles.push(cube);
});

function animate() {
  requestAnimationFrame(animate);
  updatePhysics();
  // cannonDebugRenderer.update();
  updateGrid();
  render();

  updateFns.forEach(fn => {
    fn();
  });
}
animate();

function updatePhysics() {
  // Step the physics world
  world.step(timeStep);

  // Copy coordinates from Cannon.js to Three.js

  cannonParticles.forEach((particle, index) => {
    threeParticles[index].position.copy(particle.position);
    threeParticles[index].quaternion.copy(particle.quaternion);
    // particle.position.x -= 0.3;
    particle.position.y += initMeteorPos[index];
  });
}
console.log(gridX);
console.log(gridY);
function updateGrid() {
  gridX.forEach(line => {
    if (line.position.y > 2000) {
      line.position.y = 0;
    }
    line.position.y += 2;
  });
}

function render() {
  renderer.render(scene, camera);
}
