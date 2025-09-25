<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WebGLView from './scripts/WebGLView.js';

  export let imageSrc = '/images/source.png';
  export let params: any = {};
  export let width = '100%';
  export let height = '100%';

  let webgl: any;
  let containerEl: HTMLDivElement;
  let frame: number;

  function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  function loop() {
    if (!isBrowser() || !webgl) return;
    webgl.update();
    webgl.draw();
    frame = requestAnimationFrame(loop);
  }

  onMount(() => {
    if (!isBrowser()) return;

    webgl = new WebGLView({ container: containerEl }, imageSrc);

    if (webgl?.renderer?.domElement) {
      containerEl.appendChild(webgl.renderer.domElement);
    }

    webgl.resize();
    webgl.particles?.setParams?.(params);

    loop();
    window.addEventListener('resize', webgl.resize.bind(webgl));
  });

  $: if (isBrowser() && webgl && params) {
    webgl.particles?.setParams?.(params);
  }

  onDestroy(() => {
    if (!isBrowser()) return;
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('resize', webgl.resize?.bind(webgl));
    webgl?.renderer?.dispose?.();
    webgl = null;
  });
</script>

<div
  class="spc-container"
  bind:this={containerEl}
  style="width:{width}; height:{height}; position:relative;"
></div>
