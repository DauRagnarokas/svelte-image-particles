// src/scripts/App.js
import WebGLView from './webgl/WebGLView'

export default class App {
  /**
   * imageSrc: string
   * options?: { container?: HTMLElement }
   */
  constructor(imageSrc = '/images/source.png', options = {}) {
    this.imageSrc = imageSrc
    this.container = options.container || null
    this._disposed = false

    this.animate = this.animate.bind(this)
    this.resize = this.resize.bind(this)
    this.onVisibilityChange = this.onVisibilityChange.bind(this)
    this.click = this.click.bind(this)
  }

  init() {
    this.initWebGL()
    this.addListeners()
    this.animate()
    this.resize() // first size
  }

  initWebGL() {
    this.webgl = new WebGLView(this, this.imageSrc)

    const mountTarget =
      this.container ||
      document.querySelector('.container') ||
      document.body

    this.canvas = this.webgl.renderer?.domElement
    if (!this.canvas) throw new Error('renderer.domElement missing')

    this.mountTarget = mountTarget
    mountTarget.appendChild(this.canvas)

    // if your WebGLView doesn’t auto-init particles, this is safe:
    try {
      if (this.webgl?.particles?.init && !this.webgl.particles.points) {
        this.webgl.particles.init(this.imageSrc)
      }
    } catch {}

    this.webgl?.interactive?.resize?.()
  }

  addListeners() {
    window.addEventListener('resize', this.resize)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    this.canvas?.addEventListener?.('click', this.click, { passive: true })
  }

  removeListeners() {
    window.removeEventListener('resize', this.resize)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.canvas?.removeEventListener?.('click', this.click)
  }

  // ---- loop ----
  animate() {
    if (this._disposed) return
    this.update()
    this.draw()
    this.raf = requestAnimationFrame(this.animate)
  }
  update() { this.webgl?.update?.() }
  draw()   { this.webgl?.draw?.()   }

  // ---- sizing ----
  // Use window sizing (keeps behavior identical to your original demo).
  // This was the “working” state before the container-based resize change.
  resize() {
    if (!this.webgl) return
    // Call your original view’s resize (it reads window size internally)
    this.webgl.resize?.()
    this.webgl?.interactive?.resize?.()
  }

  click() { this.webgl?.next?.() }

  onVisibilityChange() {
    if (document.hidden) cancelAnimationFrame(this.raf)
    else this.animate()
  }

  // ---- public API for Svelte wrapper ----
  setParams(overrides = {}) {
    this.webgl?.particles?.setParams?.(overrides)
  }
  setImage(src) {
    this.imageSrc = src
    this.webgl?.particles?.init?.(src)
  }

  // ---- cleanup ----
  dispose() {
    this._disposed = true
    cancelAnimationFrame(this.raf)
    this.removeListeners()
    try {
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas)
      }
    } catch {}
    this.webgl?.renderer?.dispose?.()
    this.webgl = null
    this.canvas = null
    this.mountTarget = null
  }
}
