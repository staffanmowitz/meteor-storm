let meteors = new THREE.Group()

loader.load(
  // RESOURCE URL
  'meteor-1.obj',
  // FUNCTION WHEN RESOURCE IS LOADED
  meteor => {
    ship.traverse(function(node) {
      const basicMaterial = new THREE.MeshLambertMaterial({
        color: 0x555555
      })

      if (node.geometry) {
        node.material.side = THREE.FrontSide
        node.material = basicMaterial
      }

      // DON'T USE DAT GUI
      // meteor.scale.set(0.05, 0.05, 0.05)
      // meteor.position.set(0, 10, 0)
      // meteor.rotation.set(6, 0, 3.13)

      ship.name = 'Meteor'
      ship.velocity = new THREE.Vector3(0.1, 0.1, 0.1)

      meteors.add(meteor)
    })
  }
)

export default meteors
