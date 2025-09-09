// src/lib/ParticlesCanvas.svelte

import * as THREE from 'three'
import TouchTexture from './TouchTexture'
import vert from '../../../shaders/particle.vert?raw'
import frag from '../../../shaders/particle.frag?raw'

// ---- single source of truth for all numbers ----
export const PARTICLE_PARAMS = {
  // density & filter
  pixelStep: 1,          // 1 = every pixel; 2,3,4 thin it out
  maxParticles: 45000,   // 0/null to disable cap
  darknessThreshold: 190,
  alphaMin: 8,

  // shader look
  uRandom: 2.0,
  uDepth: 2.0,
  uSize: 1.5,
  uEdge: 0.06,
  uSharpness: 6.0,
}

// helper: support old/new three attribute APIs
function setAttr(geometry, name, attribute) {
  if (typeof geometry.setAttribute === 'function') geometry.setAttribute(name, attribute)
  else geometry.addAttribute(name, attribute)
}

export default class Particles {
  constructor(webgl, overrides = {}) {
    this.webgl = webgl
    this.container = new THREE.Object3D()
    this.params = { ...PARTICLE_PARAMS, ...overrides }

    // tiny tween store (no deps)
    this._tweens = []
  }

  // --- tiny tween system (no external libs) -----------------------
  _tween(uniform, toValue, duration = 1.0, ease = (t) => t, onComplete) {
    if (!uniform) return
    const from = Number(uniform.value)
    const to = Number(toValue)
    const d = Math.max(0.0001, duration)
    this._tweens.push({ uniform, from, to, t: 0, d, ease, onComplete })
  }

  _set(uniform, value) {
    if (!uniform) return
    uniform.value = value
  }

  _updateTweens(dt) {
    if (!this._tweens.length) return
    for (let i = this._tweens.length - 1; i >= 0; i--) {
      const tw = this._tweens[i]
      tw.t += dt
      const p = Math.min(1, tw.t / tw.d)
      const k = tw.ease ? tw.ease(p) : p
      tw.uniform.value = tw.from + (tw.to - tw.from) * k
      if (p >= 1) {
        if (tw.onComplete) tw.onComplete()
        this._tweens.splice(i, 1)
      }
    }
  }
  // ---------------------------------------------------------------

  // update via variables (no GUI). Rebuild only if density/filter changed.
  setParams(next = {}) {
    const densityKeys = ['pixelStep','maxParticles','darknessThreshold','alphaMin']
    const densityChanged = densityKeys.some(k => k in next)
    this.params = { ...this.params, ...next }

    if (!this.object3D) return

    if (densityChanged && this.texture) {
      this.initPoints(true)
      this.resize()
      if (this.touch) this.object3D.material.uniforms.uTouch.value = this.touch.texture
    } else {
      const u = this.object3D.material.uniforms
      const p = this.params
      if (u.uRandom)    u.uRandom.value = p.uRandom
      if (u.uDepth)     u.uDepth.value  = p.uDepth
      if (u.uSize)      u.uSize.value   = p.uSize
      if (u.uEdge)      u.uEdge.value   = p.uEdge
      if (u.uSharpness) u.uSharpness.value = p.uSharpness
    }
  }

  init(src) {
    const loader = new THREE.TextureLoader()
    loader.load(src, (texture) => {
      // Keep alpha
      this.texture = texture
      this.texture.minFilter = THREE.LinearFilter
      this.texture.magFilter = THREE.LinearFilter
      this.texture.format = THREE.RGBAFormat
      this.texture.premultiplyAlpha = true
      this.texture.needsUpdate = true

      this.width = texture.image.width
      this.height = texture.image.height

      this.initPoints(true)   // build instances, discarding transparent pixels on CPU
      this.initHitArea()
      this.initTouch()
      this.resize()
      this.show()
    })
  }

  initPoints(discard) {
    const p = this.params

    this.numPoints = this.width * this.height

    const uniforms = {
      uTime: { value: 0 },
      uRandom: { value: p.uRandom },
      uDepth:  { value: p.uDepth },
      uSize:   { value: p.uSize },
      uTextureSize: { value: new THREE.Vector2(this.width, this.height) },
      uTexture: { value: this.texture },
      uTouch: { value: null }, // wired in initTouch()
      uEdge: { value: p.uEdge },
      uSharpness: { value: p.uSharpness },
    }

    const material = new THREE.RawShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    })

    const geometry = new THREE.InstancedBufferGeometry()

    // billboard quad
    const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3)
    positions.setXYZ(0, -0.5,  0.5, 0.0)
    positions.setXYZ(1,  0.5,  0.5, 0.0)
    positions.setXYZ(2, -0.5, -0.5, 0.0)
    positions.setXYZ(3,  0.5, -0.5, 0.0)
    setAttr(geometry, 'position', positions)

    const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2)
    uvs.setXY(0, 0.0, 0.0)
    uvs.setXY(1, 1.0, 0.0)
    uvs.setXY(2, 0.0, 1.0)
    uvs.setXY(3, 1.0, 1.0)
    setAttr(geometry, 'uv', uvs)

    if (typeof geometry.setIndex === 'function') {
      geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0,2,1, 2,3,1]), 1))
    } else {
      geometry.index = new THREE.BufferAttribute(new Uint16Array([0,2,1, 2,3,1]), 1)
    }

    // ---- Build the visible set with strides (density) ----
    let eligible = []

    if (discard) {
      const img = this.texture.image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = this.width
      canvas.height = this.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.scale(1, -1)
      ctx.drawImage(img, 0, 0, this.width, -this.height)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

      for (let y = 0; y < this.height; y += p.pixelStep) {
        for (let x = 0; x < this.width; x += p.pixelStep) {
          const i = y * this.width + x
          const base = i * 4
          const r = data[base + 0]
          const g = data[base + 1]
          const b = data[base + 2]
          const a = data[base + 3]

          if (a < p.alphaMin) continue
          const grey = 0.21 * r + 0.71 * g + 0.07 * b
          if (grey > p.darknessThreshold) continue

          eligible.push(i)
        }
      }
    } else {
      for (let y = 0; y < this.height; y += p.pixelStep) {
        for (let x = 0; x < this.width; x += p.pixelStep) {
          eligible.push(y * this.width + x)
        }
      }
    }

    if (p.maxParticles && eligible.length > p.maxParticles) {
      const skip = Math.ceil(eligible.length / p.maxParticles)
      eligible = eligible.filter((_, idx) => idx % skip === 0)
    }

    const numVisible = eligible.length
    const indices = new Uint16Array(numVisible)
    const offsets = new Float32Array(numVisible * 3)
    const angles  = new Float32Array(numVisible)

    for (let j = 0; j < numVisible; j++) {
      const i = eligible[j]
      const x = i % this.width
      const y = Math.floor(i / this.width)

      offsets[j * 3 + 0] = x
      offsets[j * 3 + 1] = y
      offsets[j * 3 + 2] = 0

      indices[j] = i
      angles[j]  = Math.random() * Math.PI
    }

    setAttr(geometry, 'pindex', new THREE.InstancedBufferAttribute(indices, 1, false))
    setAttr(geometry, 'offset', new THREE.InstancedBufferAttribute(offsets, 3, false))
    setAttr(geometry, 'angle',  new THREE.InstancedBufferAttribute(angles,  1, false))

    // mount
    if (this.object3D) {
      this.container.remove(this.object3D)
      this.object3D.geometry.dispose()
      this.object3D.material.dispose()
    }
    this.object3D = new THREE.Mesh(geometry, material)
    this.container.add(this.object3D)
  }

  initTouch() {
    if (!this.touch) this.touch = new TouchTexture(this)
    this.object3D.material.uniforms.uTouch.value = this.touch.texture
  }

  initHitArea() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      depthTest: false,
    })
    material.visible = false
    this.hitArea = new THREE.Mesh(geometry, material)
    this.container.add(this.hitArea)
  }

  addListeners() {
    this.handlerInteractiveMove = this.onInteractiveMove.bind(this)
    this.webgl.interactive.addListener('interactive-move', this.handlerInteractiveMove)
    this.webgl.interactive.objects.push(this.hitArea)
    this.webgl.interactive.enable()
  }

  removeListeners() {
    this.webgl.interactive.removeListener('interactive-move', this.handlerInteractiveMove)
    const index = this.webgl.interactive.objects.findIndex((obj) => obj === this.hitArea)
    if (index > -1) this.webgl.interactive.objects.splice(index, 1)
    this.webgl.interactive.disable()
  }

  update(delta) {
    if (!this.object3D) return
    if (this.touch) this.touch.update()
    this.object3D.material.uniforms.uTime.value += delta
    this._updateTweens(delta)
  }

  show(time = 1.0) {
    const u = this.object3D.material.uniforms
    this._set(u.uSize, 0.5)
    this._tween(u.uSize,   this.params.uSize,   time)
    this._tween(u.uRandom, this.params.uRandom, time)
    this._set(u.uDepth, 40.0)
    this._tween(u.uDepth,  this.params.uDepth,  time * 1.5)
    this.addListeners()
  }

  hide(_destroy, time = 0.8) {
    return new Promise((resolve) => {
      const u = this.object3D.material.uniforms
      this._tween(u.uRandom, 5.0,  time, undefined, () => {
        if (_destroy) this.destroy()
        resolve()
      })
      this._tween(u.uDepth,  -20.0, time)
      this._tween(u.uSize,    0.0,  time * 0.8)
      this.removeListeners()
    })
  }

  destroy() {
    if (!this.object3D) return
    this.object3D.parent.remove(this.object3D)
    this.object3D.geometry.dispose()
    this.object3D.material.dispose()
    this.object3D = null

    if (!this.hitArea) return
    this.hitArea.parent.remove(this.hitArea)
    this.hitArea.geometry.dispose()
    this.hitArea.material.dispose()
    this.hitArea = null
  }

  resize() {
    if (!this.object3D) return
    const scale = this.webgl.fovHeight / this.height
    this.object3D.scale.set(scale, scale, 1)
    this.hitArea.scale.set(scale, scale, 1)
  }

  onInteractiveMove(e) {
    const uv = e.intersectionData.uv
    if (this.touch) this.touch.addTouch(uv)
  }
}
