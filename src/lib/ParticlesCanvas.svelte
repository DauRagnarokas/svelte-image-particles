<script>
  import { onMount, onDestroy } from 'svelte'
  import App from './scripts/App.js'

  export let imageSrc = '/images/source.png'
  export let params = {}             // e.g. { pixelStep: 2, uSize: 2.0 }
  export let width = '100%'          // instance size is controlled by parent
  export let height = '100%'

  let app
  let containerEl

  onMount(() => {
    // Pass a unique container so multiple instances don’t clash
    app = new App(imageSrc, { container: containerEl })
    app.init()

    if (params && Object.keys(params).length) {
      app.setParams?.(params)
    }
  })

  // live param updates
  $: app && params && app.setParams?.(params)

  onDestroy(() => {
    app?.dispose?.()
    app = null
  })
</script>

<div class="spc-container" bind:this={containerEl} style="width:{width}; height:{height}; position:relative;"></div>

<style>
  .spc-container { overflow: hidden; }
</style>
