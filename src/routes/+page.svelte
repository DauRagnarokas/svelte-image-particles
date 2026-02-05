<script>
  import ParticlesCanvas from '$lib/ParticlesCanvas.svelte';

  let paused = false;

  const params = {
    pixelStep: 1,
    maxParticles: 25000,
    uRandom: 2.2,
    uDepth: 2.5,
    uSize: 1.8,
    uEdge: 0.05,
    uSharpness: 7.0,
  };
</script>

<main class="page">
  <ParticlesCanvas
    imageSrc="/images/source.png"
    width="100%"
    height="100vh"
    persist={true}
    {params}
			mobileParams={{ pixelStep: 2, maxParticles: 10000, pixelRatio: 1.5 }}
    {paused}
  />
  <nav class="nav">
    <a class="nav-link" href="/">Particles</a>
    <a class="nav-link" href="/second">Second</a>
  </nav>
  <div class="overlay">
    <h1>Svelte Image Particles</h1>
    <p>Move your cursor to disturb the particles.</p>
    <button class="pause-btn" on:click={() => (paused = !paused)}>
      {paused ? 'Resume' : 'Pause'}
    </button>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #fff;
    color: #000;
    font-family: "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
  }

  .page {
    position: relative;
    width: 100vw;
    height: 100vh;
  }

  .overlay {
    position: absolute;
    left: 24px;
    top: 24px;
    z-index: 10;
    background: rgba(255, 255, 255, 0.75);
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(6px);
  }

  .overlay h1 {
    margin: 0 0 4px;
    font-size: 20px;
    letter-spacing: 0.02em;
  }

  .overlay p {
    margin: 0;
    font-size: 13px;
    opacity: 0.9;
  }

  .nav {
    position: fixed;
    right: 20px;
    top: 20px;
    z-index: 20;
    display: flex;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(8px);
  }

  .nav-link {
    font-size: 12px;
    color: #111;
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 999px;
  }

  .nav-link:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  .pause-btn {
    margin-top: 10px;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    background: #fff;
    color: #111;
    font-size: 12px;
    cursor: pointer;
  }

  .pause-btn:hover {
    background: #f3f3f3;
  }
</style>
