<script context="module" lang="ts">
  // Module-level singleton so the effect can persist across navigations
  let shared: {
    webgl: any;
    frame: number;
    running: boolean;
    paused: boolean;
    resizeHandler: (() => void) | null;
    visibilityHandler: (() => void) | null;
    refCount: number;
    imageSrc: string | null;
  } = {
    webgl: null,
    frame: 0,
    running: false,
    paused: false,
    resizeHandler: null,
    visibilityHandler: null,
    refCount: 0,
    imageSrc: null,
  };
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WebGLView from './scripts/WebGLView.js';

  export let imageSrc = '/images/source.png';
  export let params: any = {};
  export let width = '100%';
  export let height = '100%';
  export let persist = true;
  export let pixelRatio: number | null = 2;
  export let paused = false;
  export let pauseOnHidden = true;

  let webgl: any;
  let containerEl: HTMLDivElement;
  let frame: number;
  let handleResize: (() => void) | null = null;
  let handleVisibility: (() => void) | null = null;
  let localPaused = false;

  function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  function loop() {
    if (!isBrowser() || !webgl) return;
    if (localPaused) return;
    webgl.update();
    webgl.draw();
    frame = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (shared.running) return;
    if (shared.paused) return;
    shared.running = true;
    const tick = () => {
      if (!shared.running || !shared.webgl || shared.paused) return;
      shared.webgl.update();
      shared.webgl.draw();
      shared.frame = requestAnimationFrame(tick);
    };
    shared.frame = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (shared.frame) cancelAnimationFrame(shared.frame);
    shared.frame = 0;
    shared.running = false;
  }

  function applyPixelRatio() {
    if (!webgl) return;
    const pr = pixelRatio == null ? null : Number(pixelRatio);
    webgl.setPixelRatio?.(pr);
  }

  function updatePauseState() {
    const hidden = pauseOnHidden && typeof document !== 'undefined' && document.hidden;
    const nextPaused = Boolean(paused || hidden);
    if (persist) {
      shared.paused = nextPaused;
      shared.webgl?.setPaused?.(shared.paused);
      if (shared.paused) {
        shared.running = false;
        stopLoop();
      } else {
        startLoop();
      }
    } else {
      localPaused = nextPaused;
      webgl?.setPaused?.(localPaused);
      if (localPaused) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      } else if (webgl && !frame) {
        frame = requestAnimationFrame(loop);
      }
    }
  }

  onMount(() => {
    if (!isBrowser()) return;

    if (persist) {
      shared.refCount += 1;

      const needsRecreate = shared.webgl && shared.imageSrc && shared.imageSrc !== imageSrc;
      if (!shared.webgl || needsRecreate) {
        if (shared.webgl) shared.webgl.dispose?.();
        shared.webgl = new WebGLView({ container: containerEl }, imageSrc, { pixelRatio });
        shared.imageSrc = imageSrc;
      }

      webgl = shared.webgl;
    } else {
      webgl = new WebGLView({ container: containerEl }, imageSrc, { pixelRatio });
    }

    if (webgl?.renderer?.domElement) {
      if (webgl.renderer.domElement.parentElement !== containerEl) {
        containerEl.appendChild(webgl.renderer.domElement);
      }
    }

    applyPixelRatio();
    webgl.resize();
    webgl.particles?.setParams?.(params);

    if (persist) {
      updatePauseState();
      if (!shared.resizeHandler) {
        shared.resizeHandler = () => shared.webgl?.resize?.();
        window.addEventListener('resize', shared.resizeHandler);
      }
      if (pauseOnHidden && !shared.visibilityHandler) {
        shared.visibilityHandler = () => updatePauseState();
        document.addEventListener('visibilitychange', shared.visibilityHandler);
      }
    } else {
      updatePauseState();
      handleResize = () => webgl?.resize?.();
      window.addEventListener('resize', handleResize);
      if (pauseOnHidden) {
        handleVisibility = () => updatePauseState();
        document.addEventListener('visibilitychange', handleVisibility);
      }
    }
  });

  $: if (isBrowser() && webgl && params) {
    webgl.particles?.setParams?.(params);
  }

  $: if (isBrowser() && webgl) {
    pixelRatio;
    applyPixelRatio();
  }

  $: if (isBrowser() && webgl) {
    paused;
    pauseOnHidden;
    updatePauseState();
  }

  onDestroy(() => {
    if (!isBrowser()) return;
    if (persist) {
      shared.refCount -= 1;
      if (webgl?.renderer?.domElement && containerEl) {
        containerEl.removeChild(webgl.renderer.domElement);
      }
      if (shared.refCount <= 0) {
        stopLoop();
        if (shared.resizeHandler) {
          window.removeEventListener('resize', shared.resizeHandler);
          shared.resizeHandler = null;
        }
        if (shared.visibilityHandler) {
          document.removeEventListener('visibilitychange', shared.visibilityHandler);
          shared.visibilityHandler = null;
        }
      }
      webgl = null;
    } else {
      if (frame) cancelAnimationFrame(frame);
      if (handleResize) window.removeEventListener('resize', handleResize);
      handleResize = null;
      if (handleVisibility) document.removeEventListener('visibilitychange', handleVisibility);
      handleVisibility = null;
      if (webgl?.renderer?.domElement && containerEl) {
        containerEl.removeChild(webgl.renderer.domElement);
      }
      webgl?.dispose?.();
      webgl = null;
    }
  });
</script>

<div
  class="spc-container"
  bind:this={containerEl}
  style="width:{width}; height:{height}; position:relative;"
></div>
