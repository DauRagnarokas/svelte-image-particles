<script context="module" lang="ts">
  // Module-level singleton so the effect can persist across navigations
  type SharedState = {
    webgl: any;
    frame: number;
    running: boolean;
    paused: boolean;
    previewFrame: number;
    previewTick: number;
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
    previewFrame: 0,
    previewTick: 0,
    resizeHandler: null,
    visibilityHandler: null,
    refCount: 0,
    imageSrc: null,
  };
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WebGLView from './scripts/WebGLView.js';

  type ParticleParams = {
    /** Sample every Nth pixel (higher = fewer particles). Default: 1. */
    pixelStep?: number;
    /** Hard cap on particle count (0/null disables). Default: 45000. */
    maxParticles?: number | null;
    /** Skip pixels brighter than this (0-255). Default: 190. */
    darknessThreshold?: number;
    /** Skip pixels with alpha below this (0-255). Default: 8. */
    alphaMin?: number;
    /** Random jitter amplitude. Default: 2.0. */
    uRandom?: number;
    /** Depth displacement strength. Default: 2.0. */
    uDepth?: number;
    /** Particle size multiplier. Default: 1.5. */
    uSize?: number;
    /** Soft edge width for the particle sprite. Default: 0.06. */
    uEdge?: number;
    /** Edge hardness exponent (higher = sharper). Default: 6.0. */
    uSharpness?: number;
    /** Tap/click burst strength. Default: 3. */
    touchBurstForce?: number;
    /** Renderer pixel ratio override (falls back to device pixel ratio, capped at 2). Default: undefined. */
    pixelRatio?: number | null;
  };

  // Default params (from Particles.js) for quick reference when tuning.
  const PARTICLE_DEFAULTS: Required<Pick<ParticleParams,
    'pixelStep' | 'maxParticles' | 'darknessThreshold' | 'alphaMin' |
    'uRandom' | 'uDepth' | 'uSize' | 'uEdge' | 'uSharpness' | 'touchBurstForce'
  >> = {
    pixelStep: 1,
    maxParticles: 45000,
    darknessThreshold: 190,
    alphaMin: 8,
    uRandom: 2.0,
    uDepth: 2.0,
    uSize: 1.5,
    uEdge: 0.06,
    uSharpness: 6.0,
    touchBurstForce: 3,
  };

  // --- Component props ---
  // Source
  export let imageSrc = '/images/source.png'; // image used to build particles

  // Layout
  export let width = '100%'; // container width
  export let height = '100%'; // container height
  export let contain = false; // letterbox the effect instead of filling

  // Rendering / params
  export let params: ParticleParams = {}; // particle/shader params (can include pixelRatio for renderer scaling)

  // Mobile defaults
  export let mobileDefaults = true; // apply mobile-friendly defaults when pointer is coarse
  export let mobileParams: Partial<ParticleParams> = {
    pixelStep: 3, // fewer particles on mobile
    maxParticles: 12000, // cap particle count for performance
    pixelRatio: 1, // lower renderer pixel ratio on mobile
  }; // mobile-only defaults (fill missing keys)
  // debugMobile removed

  // Lifecycle
  export let persist = true; // reuse singleton WebGL instance across navigations
  export let paused = false; // pause the render loop
  export let pauseOnHidden = true; // auto-pause when the tab is hidden
  // --- End component props ---

  let webgl: any;
  let containerEl: HTMLDivElement;
  let frame: number;
  let handleResize: (() => void) | null = null;
  let handleVisibility: (() => void) | null = null;
  let localPaused = false;
  let isMobilePointer = false;
  let cleanupMediaQuery: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const MOBILE_MQ = '(pointer: coarse), (max-width: 900px)';

  function getMobileMode() {
    if (!isBrowser() || !window.matchMedia) return false;
    return window.matchMedia(MOBILE_MQ).matches;
  }

  function mergeDefaults(base: ParticleParams, defaults: Partial<ParticleParams>) {
    const next: ParticleParams = { ...(base || {}) };
    if (defaults) {
      for (const [key, value] of Object.entries(defaults)) {
        if ((next as Record<string, unknown>)[key] == null) {
          (next as Record<string, unknown>)[key] = value;
        }
      }
    }
    return next;
  }

  function resolveEffectiveParams() {
    return (mobileDefaults && isMobilePointer)
      ? { ...(params || {}), ...(mobileParams || {}) }
      : params;
  }

  function resolveParticleParams(nextParams: ParticleParams | null | undefined) {
    const resolvedFit = contain ? 'contain' : undefined;
    // Strip renderer-only keys before passing to particle params
    const { pixelRatio: _pixelRatio, ...particleParams } = nextParams || {};
    return { ...particleParams, fit: resolvedFit };
  }

  function updateParticleParams() {
    if (!webgl) return;
    const nextParams = resolveParticleParams(effectiveParams);
    webgl.particles?.setParams?.(nextParams);
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

  function startPreviewLoop() {
    if (shared.previewFrame) return;
    const tick = () => {
      if (!shared.webgl) return;
      shared.previewTick += 1;
      if (shared.previewTick % 2 === 0) {
        shared.webgl.drawFrame?.();
      }
      shared.previewFrame = requestAnimationFrame(tick);
    };
    shared.previewFrame = requestAnimationFrame(tick);
  }

  function stopPreviewLoop() {
    if (shared.previewFrame) cancelAnimationFrame(shared.previewFrame);
    shared.previewFrame = 0;
    shared.previewTick = 0;
  }

  function applyPixelRatio() {
    if (!webgl) return;
    const pr = effectivePixelRatio == null ? null : Number(effectivePixelRatio);
    webgl.setPixelRatio?.(pr);
  }

  function scheduleInitialResize() {
    if (!isBrowser() || !webgl || !containerEl) return;
    let attempts = 0;
    const tryResize = () => {
      const w = containerEl.clientWidth;
      const h = containerEl.clientHeight;
      if (w > 0 && h > 0) {
        webgl.resize();
      } else if (attempts < 5) {
        attempts += 1;
        requestAnimationFrame(tryResize);
      }
    };
    requestAnimationFrame(tryResize);
  }

  function updatePauseState() {
    const hidden = pauseOnHidden && typeof document !== 'undefined' && document.hidden;
    const nextPaused = Boolean(paused || hidden);
    if (persist) {
      if (nextPaused) {
        shared.paused = true;
        shared.webgl?.setPaused?.(true);
        shared.webgl?.particles?.removeListeners?.();
        startPreviewLoop();
        shared.running = false;
        stopLoop();
      } else {
        stopPreviewLoop();
        shared.paused = false;
        shared.webgl?.setPaused?.(false);
        if (shared.webgl) shared.webgl.skipNextDelta = true;
        shared.webgl?.particles?.addListeners?.();
        shared.webgl?.clock?.start?.();
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
    isMobilePointer = getMobileMode();
    if (window.matchMedia) {
      const mq = window.matchMedia(MOBILE_MQ);
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
      if (webgl?.app) webgl.app.container = containerEl;
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
    scheduleInitialResize();
    updateParticleParams();

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

  $: effectiveParams = (isMobilePointer, resolveEffectiveParams());

  $: pixelRatioFromParams =
    effectiveParams && typeof effectiveParams.pixelRatio !== 'undefined'
      ? effectiveParams.pixelRatio
      : undefined;

  $: effectivePixelRatio = pixelRatioFromParams;

  $: if (isBrowser() && webgl && effectiveParams) {
    updateParticleParams();
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
      shared.webgl?.particles?.removeListeners?.();
      if (webgl?.renderer?.domElement && containerEl) {
        containerEl.removeChild(webgl.renderer.domElement);
      }
      if (shared.refCount <= 0) {
        shared.webgl?.setPaused?.(true);
        stopPreviewLoop();
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
