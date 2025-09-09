// src/scripts/webgl/WebGLView.js
import * as THREE from 'three'
import InteractiveControls from './InteractiveControls.js'
import Particles from './Particles.js'

export default class WebGLView {
  constructor(app, imageSrc = '/images/source.png') {
    this.app = app
    this.imageSrc = imageSrc

    this.initThree()
    this.initParticles()
    this.initControls()

    // IMPORTANT: use a PNG with transparency (now configurable)
    this.particles.init(this.imageSrc)
  }

  initThree() {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(50, 1, 1, 10000)
    this.camera.position.z = 300

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setClearColor(0x000000, 0.0)

    // 🔥 don’t append canvas here, App will handle it
    // Just do an initial size (window as fallback)
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)

    this.clock = new THREE.Clock(true)
  }

  initControls() {
    this.interactive = new InteractiveControls(this.camera, this.renderer.domElement)
    this.interactive.resize()
  }

  initParticles() {
    this.particles = new Particles(this)
    this.scene.add(this.particles.container)
  }

  update() {
    const delta = this.clock.getDelta()
    if (this.particles) this.particles.update(delta)
  }

  draw() {
    this.renderer.render(this.scene, this.camera)
  }

  resize() {
    if (!this.renderer) return

    // default: match window size
    const w = this.app?.container?.clientWidth || window.innerWidth
    const h = this.app?.container?.clientHeight || window.innerHeight

    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()

    this.fovHeight =
      2 * Math.tan((this.camera.fov * Math.PI) / 180 / 2) * this.camera.position.z

    this.renderer.setSize(w, h)

    if (this.interactive) this.interactive.resize()
    if (this.particles) this.particles.resize()
  }
}
