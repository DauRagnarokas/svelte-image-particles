<!-- src/lib/ParticlesCanvas.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte'
  import WebGLView from './scripts/WebGLView.js'

  export let imageSrc = '/images/source.png'
  export let params = {}
  export let width = '100%'
  export let height = '100%'

  let webgl
  let containerEl
  let frame

  function loop() {
    if (!webgl) return
    webgl.update()
    webgl.draw()
    frame = requestAnimationFrame(loop)
  }

  onMount(() => {
    webgl = new WebGLView({ container: containerEl }, imageSrc)

    // append canvas manually
    if (webgl?.renderer?.domElement) {
      containerEl.appendChild(webgl.renderer.domElement)
    }

    webgl.resize()
    webgl.particles?.setParams?.(params)

    loop()
    window.addEventListener('resize', webgl.resize.bind(webgl))
  })

  $: webgl && params && webgl.particles?.setParams?.(params)

  onDestroy(() => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', webgl.resize?.bind(webgl))
    webgl?.renderer?.dispose?.()
    webgl = null
  })
</script>

<div
  class="spc-container"
  bind:this={containerEl}
  style="width:{width}; height:{height}; position:relative;"
></div>
