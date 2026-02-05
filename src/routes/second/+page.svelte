<main class="second">
  <nav class="nav">
    <a class="nav-link" href="/">Particles</a>
    <a class="nav-link" href="/second">Second</a>
  </nav>
  <div class="card">
    <h1>Second Page</h1>
    <p>This is a simple second route linked from the particles demo.</p>
    <a class="link" href="/">Back to particles</a>
  </div>
</main>

<style>
  .second {
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: radial-gradient(circle at 20% 20%, #f6f3ff 0%, #eef7ff 45%, #fdfcf7 100%);
    color: #0f172a;
    font-family: "Helvetica Neue", Arial, sans-serif;
  }

  .card {
    background: rgba(255, 255, 255, 0.85);
    padding: 24px 28px;
    border-radius: 14px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    box-shadow: 0 18px 60px rgba(15, 23, 42, 0.18);
    max-width: 420px;
  }

  .card h1 {
    margin: 0 0 6px;
    font-size: 22px;
    letter-spacing: 0.02em;
  }

  .card p {
    margin: 0 0 14px;
    font-size: 14px;
    line-height: 1.5;
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
    border: 1px solid rgba(15, 23, 42, 0.12);
    backdrop-filter: blur(8px);
  }

  .nav-link {
    font-size: 12px;
    color: #0f172a;
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 999px;
  }

  .nav-link:hover {
    background: rgba(15, 23, 42, 0.06);
  }

  .link {
    display: inline-block;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(15, 23, 42, 0.2);
    text-decoration: none;
    color: #0f172a;
    background: #fff;
    font-size: 13px;
  }

  .link:hover {
    background: #f1f5f9;
  }
</style>
