// src/scripts/WebGLView.js
import * as THREE from 'three'
import InteractiveControls from './InteractiveControls.js'
import Particles from './Particles.js'

export default class WebGLView {
  constructor(app, imageSrc = '/images/source.png', options = {}) {
    this.app = app
    this.imageSrc = imageSrc
    this.pixelRatio = options.pixelRatio
    this.paused = false

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
    this.setPixelRatio(this.pixelRatio)
    this.renderer.setClearColor(0x000000, 0.0)

    // 🔥 don’t append canvas here, App will handle it
    // Just do an initial size (window as fallback)
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)

    this.clock = new THREE.Clock(true)
  }

  setPixelRatio(value) {
    const pr =
      value == null ? Math.min(window.devicePixelRatio || 1, 2) : Math.max(0.5, Number(value))
    if (this.renderer) this.renderer.setPixelRatio(pr)
  }

  setPaused(value) {
    this.paused = Boolean(value)
    if (this.paused && this.clock) this.clock.stop()
    if (!this.paused && this.clock) this.clock.start()
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
    if (this.paused) return
    const delta = this.clock.getDelta()
    if (this.particles) this.particles.update(delta)
  }

  draw() {
    if (this.paused) return
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

  dispose() {
    if (this.interactive) this.interactive.disable()

    if (this.particles) {
      this.particles.destroy()
      this.particles = null
    }

    if (this.scene) {
      this.scene.clear()
      this.scene = null
    }

    if (this.renderer) {
      if (this.renderer.renderLists) this.renderer.renderLists.dispose()
      this.renderer.dispose()
      if (this.renderer.forceContextLoss) this.renderer.forceContextLoss()
      this.renderer = null
    }
  }
}
