<script context="module" lang="ts">
  // Module-level singleton so the effect can persist across navigations
  type SharedState = {
    webgl: any;
    frame: number;
    running: boolean;
    paused: boolean;
    resizeHandler: (() => void) | null;
    visibilityHandler: (() => void) | null;
    refCount: number;
    imageSrc: string | null;
  };

  let shared: SharedState = {
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

  export let imageSrc = '/images/source.png'; // image used to build particles
  export let params: any = {}; // particle/shader params (can include pixelRatio for renderer scaling)
  export let width = '100%'; // container width
  export let height = '100%'; // container height
  export let contain = false; // letterbox the effect instead of filling (fit can override)
  export let fit: 'cover' | 'contain' | null = null; // optional fit override (null keeps legacy height-based scale)
  export let persist = true; // reuse singleton WebGL instance across navigations
  export let pixelRatio: number | null = 2; // deprecated: prefer params.pixelRatio
  export let mobileDefaults = true; // apply mobile-friendly defaults when pointer is coarse
  export let mobilePixelRatio: number | null = 1; // pixel ratio for mobile defaults
  export let mobileParams: any = { pixelStep: 3, maxParticles: 12000 }; // mobile-only defaults (fill missing keys)
  export let paused = false; // pause the render loop
  export let pauseOnHidden = true; // auto-pause when the tab is hidden

  let webgl: any;
  let containerEl: HTMLDivElement;
  let frame: number;
  let handleResize: (() => void) | null = null;
  let handleVisibility: (() => void) | null = null;
  let localPaused = false;
  let isMobilePointer = false;
  let cleanupMediaQuery: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function getCoarsePointer() {
    if (!isBrowser() || !window.matchMedia) return false;
    return window.matchMedia('(pointer: coarse)').matches;
  }

  function mergeDefaults(base: any, defaults: any) {
    const next = { ...(base || {}) };
    if (defaults) {
      for (const [key, value] of Object.entries(defaults)) {
        if (next[key] == null) next[key] = value;
      }
    }
    return next;
  }

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
    const pr = effectivePixelRatio == null ? null : Number(effectivePixelRatio);
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
    isMobilePointer = getCoarsePointer();
    if (window.matchMedia) {
      const mq = window.matchMedia('(pointer: coarse)');
      const handler = () => {
        isMobilePointer = mq.matches;
      };
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else mq.addListener(handler);
      cleanupMediaQuery = () => {
        if (mq.removeEventListener) mq.removeEventListener('change', handler);
        else mq.removeListener(handler);
      };
    }

    if (persist) {
      shared.refCount += 1;

      const needsRecreate = shared.webgl && shared.imageSrc && shared.imageSrc !== imageSrc;
      if (!shared.webgl || needsRecreate) {
        if (shared.webgl) shared.webgl.dispose?.();
        shared.webgl = new WebGLView(
          { container: containerEl },
          imageSrc,
          { pixelRatio: effectivePixelRatio }
        );
        shared.imageSrc = imageSrc;
      }

      webgl = shared.webgl;
    } else {
      webgl = new WebGLView(
        { container: containerEl },
        imageSrc,
        { pixelRatio: effectivePixelRatio }
      );
    }

    if (webgl?.renderer?.domElement) {
      if (webgl.renderer.domElement.parentElement !== containerEl) {
        containerEl.appendChild(webgl.renderer.domElement);
      }
      webgl.renderer.domElement.style.width = '100%';
      webgl.renderer.domElement.style.height = '100%';
      webgl.renderer.domElement.style.display = 'block';
    }

    applyPixelRatio();
    webgl.resize();
    webgl.particles?.setParams?.({ ...effectiveParams, fit });

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

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => webgl?.resize?.());
      resizeObserver.observe(containerEl);
    }
  });

  $: effectiveParams = (mobileDefaults && isMobilePointer)
    ? mergeDefaults(params, mobileParams)
    : params;

  $: pixelRatioFromParams =
    effectiveParams && typeof effectiveParams.pixelRatio !== 'undefined'
      ? effectiveParams.pixelRatio
      : pixelRatio;

  $: effectivePixelRatio =
    mobileDefaults && isMobilePointer && (pixelRatioFromParams == null || pixelRatioFromParams === 2)
      ? mobilePixelRatio
      : pixelRatioFromParams;

  $: if (isBrowser() && webgl && effectiveParams) {
    const resolvedFit = contain ? 'contain' : fit;
    // Strip renderer-only keys before passing to particle params
    const { pixelRatio: _pixelRatio, ...particleParams } = effectiveParams || {};
    webgl.particles?.setParams?.({ ...particleParams, fit: resolvedFit });
  }

  $: if (isBrowser() && webgl) {
    applyPixelRatio();
  }

  $: if (isBrowser() && webgl) {
    paused;
    pauseOnHidden;
    updatePauseState();
  }

  onDestroy(() => {
    if (!isBrowser()) return;
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (cleanupMediaQuery) cleanupMediaQuery();
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
