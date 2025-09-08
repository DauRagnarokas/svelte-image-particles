// src/scripts/webgl/controls/InteractiveControls.js
// Uses eventemitter3 for reliability; no browser-detect needed.
// Pointer Events handle mouse/touch/pen uniformly.

import EventEmitter from 'eventemitter3'
import * as THREE from 'three'

export default class InteractiveControls extends EventEmitter {
  get enabled() { return this._enabled }

  constructor(camera, el) {
    super()

    this.camera = camera
    this.el = el || window

    // picking helpers
    this.plane = new THREE.Plane()
    this.raycaster = new THREE.Raycaster()
    // Important for Points picking (pixel “thickness”)
    this.raycaster.params.Points.threshold = 6 // try 4–10 to taste

    this.mouse = new THREE.Vector2()
    this.offset = new THREE.Vector3()
    this.intersection = new THREE.Vector3()

    this.objects = []     // consumer should set: e.g. [points]
    this.hovered = null
    this.selected = null
    this.isDown = false

    // Public pointer state (NDC + 0..1 for textures)
    this.pointer = { x: 0, y: 0, x01: 0.5, y01: 0.5, isDown: false }

    // cached element rect
    this.rect = { x: 0, y: 0, width: 1, height: 1 }

    this.enable()
  }

  enable() {
    if (this.enabled) return
    this.addListeners()
    this.resize() // initialize rect once listeners are active
    this._enabled = true
  }

  disable() {
    if (!this.enabled) return
    this.removeListeners()
    this._enabled = false
  }

  addListeners() {
    this.handlerDown  = this.onDown.bind(this)
    this.handlerMove  = this.onMove.bind(this)
    this.handlerUp    = this.onUp.bind(this)
    this.handlerLeave = this.onLeave.bind(this)

    const opts = { passive: true }
    this.el.addEventListener('pointerdown',  this.handlerDown,  opts)
    this.el.addEventListener('pointermove',  this.handlerMove,  opts)
    this.el.addEventListener('pointerup',    this.handlerUp,    opts)
    this.el.addEventListener('pointerleave', this.handlerLeave, opts)
    this.el.addEventListener('pointercancel', this.handlerLeave, opts)
  }

  removeListeners() {
    this.el.removeEventListener('pointerdown',  this.handlerDown)
    this.el.removeEventListener('pointermove',  this.handlerMove)
    this.el.removeEventListener('pointerup',    this.handlerUp)
    this.el.removeEventListener('pointerleave', this.handlerLeave)
    this.el.removeEventListener('pointercancel', this.handlerLeave)
  }

  // Call with explicit rect or let it detect from element/window
  resize(x, y, width, height) {
    if (x != null || y != null || width != null || height != null) {
      this.rect = { x: x || 0, y: y || 0, width: width || 1, height: height || 1 }
    } else if (this.el === window) {
      this.rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }
    } else {
      const r = this.el.getBoundingClientRect()
      this.rect = { x: r.left, y: r.top, width: r.width, height: r.height }
    }
  }

  onMove(e) {
    const cx = e.clientX
    const cy = e.clientY

    // Local coords within the element rect
    const lx = (cx - this.rect.x)
    const ly = (cy - this.rect.y)

    // NDC (-1..1)
    this.mouse.x = (lx / this.rect.width) * 2 - 1
    this.mouse.y = -(ly / this.rect.height) * 2 + 1

    // Also keep 0..1 UV-like
    this.pointer.x01 = (this.mouse.x + 1) * 0.5
    this.pointer.y01 = (1 - this.mouse.y) * 0.5
    this.pointer.x = this.mouse.x
    this.pointer.y = this.mouse.y

    this.raycaster.setFromCamera(this.mouse, this.camera)

    // If dragging behavior is desired, re-enable this block:
    // if (this.selected && this.isDown) {
    //   if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
    //     this.emit('interactive-drag', { object: this.selected, position: this.intersection.sub(this.offset) })
    //   }
    //   return
    // }

    const intersects = this.raycaster.intersectObjects(this.objects, false)

    if (intersects.length > 0) {
      const object = intersects[0].object
      this.intersectionData = intersects[0]

      this.plane.setFromNormalAndCoplanarPoint(
        this.camera.getWorldDirection(this.plane.normal),
        object.position
      )

      if (this.hovered !== object) {
        this.emit('interactive-out', { object: this.hovered })
        this.emit('interactive-over', { object })
        this.hovered = object
      } else {
        this.emit('interactive-move', { object, intersectionData: this.intersectionData })
      }
    } else {
      this.intersectionData = null
      if (this.hovered !== null) {
        this.emit('interactive-out', { object: this.hovered })
        this.hovered = null
      }
    }
  }

  onDown(e) {
    this.isDown = true
    this.pointer.isDown = true
    this.onMove(e)

    this.emit('interactive-down', {
      object: this.hovered,
      previous: this.selected,
      intersectionData: this.intersectionData
    })
    this.selected = this.hovered

    if (this.selected) {
      if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
        this.offset.copy(this.intersection).sub(this.selected.position)
      }
    }
  }

  onUp() {
    this.isDown = false
    this.pointer.isDown = false
    this.emit('interactive-up', { object: this.hovered })
  }

  onLeave() {
    this.onUp()
    this.emit('interactive-out', { object: this.hovered })
    this.hovered = null
  }
}
