var THREEx = THREEx || {}

// THREEx.KeyboardState.js keep the current state of the keyboard.
// It is possible to query it at any time. No need of an event.
// This is particularly convenient in loop driven case, like in
// 3D demos or games.
//
// # Usage
//
// **Step 1**: Create the object
//
// ```var keyboard	= new THREEx.KeyboardState();```
//
// **Step 2**: Query the keyboard state
//
// This will return true if shift and A are pressed, false otherwise
//
// ```keyboard.pressed("shift+A")```
//
// **Step 3**: Stop listening to the keyboard
//
// ```keyboard.destroy()```
//
// NOTE: this library may be nice as standaline. independant from three.js
// - rename it keyboardForGame
//
// # Code
//

/** @namespace */

/**
 * - NOTE: it would be quite easy to push event-driven too
 *   - microevent.js for events handling
 *   - in this._onkeyChange, generate a string from the DOM event
 *   - use this as event name
*/
THREEx.KeyboardState = function(domElement) {
  this.domElement = domElement || document
  // to store the current state
  this.keyCodes = {}
  this.modifiers = {}

  // create callback to bind/unbind keyboard events
  var _this = this
  this._onKeyDown = function(event) {
    _this._onKeyChange(event)
  }
  this._onKeyUp = function(event) {
    _this._onKeyChange(event)
  }

  // bind keyEvents
  this.domElement.addEventListener('keydown', this._onKeyDown, false)
  this.domElement.addEventListener('keyup', this._onKeyUp, false)

  // create callback to bind/unbind window blur event
  this._onBlur = function() {
    for (var prop in _this.keyCodes) _this.keyCodes[prop] = false
    for (var prop in _this.modifiers) _this.modifiers[prop] = false
  }

  // bind window blur
  window.addEventListener('blur', this._onBlur, false)
}

/**
 * To stop listening of the keyboard events
*/
THREEx.KeyboardState.prototype.destroy = function() {
  // unbind keyEvents
  this.domElement.removeEventListener('keydown', this._onKeyDown, false)
  this.domElement.removeEventListener('keyup', this._onKeyUp, false)

  // unbind window blur event
  window.removeEventListener('blur', this._onBlur, false)
}

THREEx.KeyboardState.MODIFIERS = ['shift', 'ctrl', 'alt', 'meta']
THREEx.KeyboardState.ALIAS = {
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  space: 32,
  pageup: 33,
  pagedown: 34,
  tab: 9,
  escape: 27
}

/**
 * to process the keyboard dom event
*/
THREEx.KeyboardState.prototype._onKeyChange = function(event) {
  // log to debug
  //console.log("onKeyChange", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)

  // update this.keyCodes
  var keyCode = event.keyCode
  var pressed = event.type === 'keydown' ? true : false
  this.keyCodes[keyCode] = pressed
  // update this.modifiers
  this.modifiers['shift'] = event.shiftKey
  this.modifiers['ctrl'] = event.ctrlKey
  this.modifiers['alt'] = event.altKey
  this.modifiers['meta'] = event.metaKey
}

/**
 * query keyboard state to know if a key is pressed of not
 *
 * @param {String} keyDesc the description of the key. format : modifiers+key e.g shift+A
 * @returns {Boolean} true if the key is pressed, false otherwise
*/
THREEx.KeyboardState.prototype.pressed = function(keyDesc) {
  var keys = keyDesc.split('+')
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    var pressed = false
    if (THREEx.KeyboardState.MODIFIERS.indexOf(key) !== -1) {
      pressed = this.modifiers[key]
    } else if (Object.keys(THREEx.KeyboardState.ALIAS).indexOf(key) != -1) {
      pressed = this.keyCodes[THREEx.KeyboardState.ALIAS[key]]
    } else {
      pressed = this.keyCodes[key.toUpperCase().charCodeAt(0)]
    }
    if (!pressed) return false
  }
  return true
}

/**
 * return true if an event match a keyDesc
 * @param  {KeyboardEvent} event   keyboard event
 * @param  {String} keyDesc string description of the key
 * @return {Boolean}         true if the event match keyDesc, false otherwise
 */
THREEx.KeyboardState.prototype.eventMatches = function(event, keyDesc) {
  var aliases = THREEx.KeyboardState.ALIAS
  var aliasKeys = Object.keys(aliases)
  var keys = keyDesc.split('+')
  // log to debug
  // console.log("eventMatches", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    var pressed = false
    if (key === 'shift') {
      pressed = event.shiftKey ? true : false
    } else if (key === 'ctrl') {
      pressed = event.ctrlKey ? true : false
    } else if (key === 'alt') {
      pressed = event.altKey ? true : false
    } else if (key === 'meta') {
      pressed = event.metaKey ? true : false
    } else if (aliasKeys.indexOf(key) !== -1) {
      pressed = event.keyCode === aliases[key] ? true : false
    } else if (event.keyCode === key.toUpperCase().charCodeAt(0)) {
      pressed = true
    }
    if (!pressed) return false
  }
  return true
}

/**
 * dilate a geometry inplace
 * @param  {THREE.Geometry} geometry geometry to dilate
 * @param  {Number} length   percent to dilate, use negative value to erode
 */
THREEx.dilateGeometry = function(geometry, length) {
  // gather vertexNormals from geometry.faces
  var vertexNormals = new Array(geometry.vertices.length)
  geometry.faces.forEach(function(face) {
    if (face instanceof THREE.Face4) {
      vertexNormals[face.a] = face.vertexNormals[0]
      vertexNormals[face.b] = face.vertexNormals[1]
      vertexNormals[face.c] = face.vertexNormals[2]
      vertexNormals[face.d] = face.vertexNormals[3]
    } else if (face instanceof THREE.Face3) {
      vertexNormals[face.a] = face.vertexNormals[0]
      vertexNormals[face.b] = face.vertexNormals[1]
      vertexNormals[face.c] = face.vertexNormals[2]
    } else console.assert(false)
  })
  // modify the vertices according to vertextNormal
  geometry.vertices.forEach(function(vertex, idx) {
    var vertexNormal = vertexNormals[idx]
    vertex.x += vertexNormal.x * length
    vertex.y += vertexNormal.y * length
    vertex.z += vertexNormal.z * length
  })
}

/**
 * from http://stemkoski.blogspot.fr/2013/07/shaders-in-threejs-glow-and-halo.html
 * @return {[type]} [description]
 */
THREEx.createAtmosphereMaterial = function() {
  var vertexShader = [
    'varying vec3	vVertexWorldPosition;',
    'varying vec3	vVertexNormal;',

    'varying vec4	vFragColor;',

    'void main(){',
    '	vVertexNormal	= normalize(normalMatrix * normal);',

    '	vVertexWorldPosition	= (modelMatrix * vec4(position, 1.0)).xyz;',

    '	// set gl_Position',
    '	gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n')
  var fragmentShader = [
    'uniform vec3	glowColor;',
    'uniform float	coeficient;',
    'uniform float	power;',

    'varying vec3	vVertexNormal;',
    'varying vec3	vVertexWorldPosition;',

    'varying vec4	vFragColor;',

    'void main(){',
    '	vec3 worldCameraToVertex= vVertexWorldPosition - cameraPosition;',
    '	vec3 viewCameraToVertex	= (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;',
    '	viewCameraToVertex	= normalize(viewCameraToVertex);',
    '	float intensity		= pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);',
    '	gl_FragColor		= vec4(glowColor, intensity);',
    '}'
  ].join('\n')

  // create custom material from the shader code above
  //   that is within specially labeled script tags
  var material = new THREE.ShaderMaterial({
    uniforms: {
      coeficient: {
        type: 'f',
        value: 1.0
      },
      power: {
        type: 'f',
        value: 2
      },
      glowColor: {
        type: 'c',
        value: new THREE.Color('pink')
      }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    //blending	: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  })
  return material
}

THREEx.GeometricGlowMesh = function(mesh) {
  var object3d = new THREE.Object3D()

  var geometry = mesh.geometry.clone()
  THREEx.dilateGeometry(geometry, 0.01)
  var material = THREEx.createAtmosphereMaterial()
  material.uniforms.glowColor.value = new THREE.Color('cyan')
  material.uniforms.coeficient.value = 1.1
  material.uniforms.power.value = 1.4
  var insideMesh = new THREE.Mesh(geometry, material)
  object3d.add(insideMesh)

  var geometry = mesh.geometry.clone()
  THREEx.dilateGeometry(geometry, 0.1)
  var material = THREEx.createAtmosphereMaterial()
  material.uniforms.glowColor.value = new THREE.Color('cyan')
  material.uniforms.coeficient.value = 0.1
  material.uniforms.power.value = 1.2
  material.side = THREE.BackSide
  var outsideMesh = new THREE.Mesh(geometry, material)
  object3d.add(outsideMesh)

  // expose a few variable
  this.object3d = object3d
  this.insideMesh = insideMesh
  this.outsideMesh = outsideMesh
}

THREEx.addAtmosphereMaterial2DatGui = function(material, datGui) {
  datGui = datGui || new dat.GUI()
  var uniforms = material.uniforms
  // options
  var options = {
    coeficient: uniforms['coeficient'].value,
    power: uniforms['power'].value,
    glowColor: '#' + uniforms.glowColor.value.getHexString(),
    presetFront: function() {
      options.coeficient = 1
      options.power = 2
      onChange()
    },
    presetBack: function() {
      options.coeficient = 0.5
      options.power = 4.0
      onChange()
    }
  }
  var onChange = function() {
    uniforms['coeficient'].value = options.coeficient
    uniforms['power'].value = options.power
    uniforms.glowColor.value.set(options.glowColor)
  }
  onChange()

  // config datGui
  datGui
    .add(options, 'coeficient', 0.0, 2)
    .listen()
    .onChange(onChange)
  datGui
    .add(options, 'power', 0.0, 5)
    .listen()
    .onChange(onChange)
  datGui
    .addColor(options, 'glowColor')
    .listen()
    .onChange(onChange)
  datGui.add(options, 'presetFront')
  datGui.add(options, 'presetBack')
}

THREEx.addAtmosphereMaterial2DatGui = function(material, datGui) {
  datGui = datGui || new dat.GUI()
  var uniforms = material.uniforms
  // options
  var options = {
    coeficient: uniforms['coeficient'].value,
    power: uniforms['power'].value,
    glowColor: '#' + uniforms.glowColor.value.getHexString(),
    presetFront: function() {
      options.coeficient = 1
      options.power = 2
      onChange()
    },
    presetBack: function() {
      options.coeficient = 0.5
      options.power = 4.0
      onChange()
    }
  }
  var onChange = function() {
    uniforms['coeficient'].value = options.coeficient
    uniforms['power'].value = options.power
    uniforms.glowColor.value.set(options.glowColor)
  }
  onChange()

  // config datGui
  datGui
    .add(options, 'coeficient', 0.0, 2)
    .listen()
    .onChange(onChange)
  datGui
    .add(options, 'power', 0.0, 5)
    .listen()
    .onChange(onChange)
  datGui
    .addColor(options, 'glowColor')
    .listen()
    .onChange(onChange)
  datGui.add(options, 'presetFront')
  datGui.add(options, 'presetBack')
}

THREEx.LaserBeam = function() {
  var object3d = new THREE.Object3D()
  this.object3d = object3d
  // generate the texture
  var canvas = generateLaserBodyCanvas()
  var texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  // do the material
  var material = new THREE.MeshBasicMaterial({
    map: texture,
    blending: THREE.AdditiveBlending,
    color: 0x4444aa,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true
  })
  var geometry = new THREE.PlaneGeometry(1, 0.1)
  var nPlanes = 16
  for (var i = 0; i < nPlanes; i++) {
    var mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = 1 / 2
    mesh.rotation.x = i / nPlanes * Math.PI
    object3d.add(mesh)
  }
  return

  function generateLaserBodyCanvas() {
    // init canvas
    var canvas = document.createElement('canvas')
    var context = canvas.getContext('2d')
    canvas.width = 1
    canvas.height = 64
    // set gradient
    var gradient = context.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    )
    gradient.addColorStop(0, 'rgba(  0,  0,  0,0.1)')
    gradient.addColorStop(0.1, 'rgba(160,160,160,0.3)')
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)')
    gradient.addColorStop(0.9, 'rgba(160,160,160,0.3)')
    gradient.addColorStop(1.0, 'rgba(  0,  0,  0,0.1)')
    // fill the rectangle
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    // return the just built canvas
    return canvas
  }
}

export default THREEx
