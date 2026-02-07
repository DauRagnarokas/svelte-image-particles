# svelte-image-particles

✨ A Svelte component for rendering interactive particle systems from images, powered by Three.js
and GLSL shaders.

## 🚀 Features
- Render images as particle fields
- Smooth interactive motion
- Built with Svelte 5 + Three.js
- Customizable shaders for advanced effects

## 📦 Installation
Install directly from GitHub (no npm publish required):

```bash
pnpm add github:DauRagnarokas/svelte-image-particles#main
```

For stable releases, use a tagged version instead of `#main`:

```bash
pnpm add github:DauRagnarokas/svelte-image-particles#v0.0.1
```

## 🛠 Host Project Setup (Vite)
This library ships GLSL shader files (`.vert` / `.frag`). Tell Vite how to load them.

### Option 1 — Minimal (recommended)
Add this to your `vite.config.ts`:

```ts
export default defineConfig({
  assetsInclude: ['**/*.frag', '**/*.vert'],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.vert': 'text',
        '.frag': 'text'
      }
    }
  }
});
```

### Option 2 — With plugin (alternative)
Install `vite-plugin-glsl`:

```bash
pnpm add -D vite-plugin-glsl
```

And in `vite.config.ts`:

```ts
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()]
});
```

## 🎨 Usage
In your Svelte component:

```svelte
<script>
  import { ParticlesCanvas } from 'svelte-image-particles';
</script>

<section class="relative h-screen bg-black">
  <!-- Pass your image as a prop -->
  <ParticlesCanvas imageSrc="/images/logo.png" />
</section>
```

### Params example
Override particle settings via the `params` prop:

```svelte
<script>
  import { ParticlesCanvas } from 'svelte-image-particles';

  const params = {
    pixelStep: 2,
    maxParticles: 25000,
    uRandom: 2.2,
    uDepth: 2.5,
    uSize: 1.8,
    uEdge: 0.05,
    uSharpness: 7.0,
    touchBurstForce: 5,
    longTouchBurstForce: 10,
    longTouchDelay: 350
  };
</script>

<ParticlesCanvas imageSrc="/images/logo.png" params={params} />
```

## ⚙️ Props
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `imageSrc` | `string` | `/images/source.png` | Path/URL to the image to convert to particles |
| `width` | `string` | `100%` | Container width (CSS value) |
| `height` | `string` | `100%` | Container height (CSS value) |
| `contain` | `boolean` | `false` | Contain particles within the container (letterbox) |
| `params` | `object` | `{}` | Particle/shader parameter overrides passed to the renderer |
| `mobileDefaults` | `boolean` | `true` | Apply mobile-friendly defaults when pointer is coarse |
| `mobileParams` | `object` | `{ pixelStep: 3, maxParticles: 12000, pixelRatio: 1 }` | Mobile-only defaults (only fill missing keys) |
| `persist` | `boolean` | `true` | Reuse a singleton WebGL instance across navigations |
| `paused` | `boolean` | `false` | Pause the render loop |
| `pauseOnHidden` | `boolean` | `true` | Auto-pause when the tab is hidden |

### `params` keys
These map directly to `Particles.setParams()` and shader uniforms (see `src/lib/scripts/Particles.js` for defaults).

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `pixelStep` | `number` | `1` | Sample every Nth pixel (higher = fewer particles) |
| `maxParticles` | `number` | `45000` | Hard cap on particle count (`0`/`null` disables) |
| `darknessThreshold` | `number` | `190` | Skip pixels brighter than this (0-255) |
| `alphaMin` | `number` | `8` | Skip pixels with alpha below this (0-255) |
| `pixelRatio` | `number \| null` | `undefined` | Renderer pixel ratio override (falls back to device pixel ratio) |
| `uRandom` | `number` | `2.0` | Random jitter amplitude |
| `uDepth` | `number` | `2.0` | Depth displacement strength |
| `uSize` | `number` | `1.5` | Particle size multiplier |
| `uEdge` | `number` | `0.06` | Soft edge width for the particle sprite |
| `uSharpness` | `number` | `6.0` | Edge hardness exponent (higher = sharper) |
| `touchBurstForce` | `number` | `5` | Tap/click burst strength |
| `longTouchBurstForce` | `number` | `10` | Long-press burst strength |
| `longTouchDelay` | `number` | `350` | Long-press delay in ms |

## ✅ Test Locally
Install dependencies and run the dev server:

```bash
pnpm install
pnpm dev
```

Then open the local URL printed in the terminal (usually `http://localhost:5173`).

## 🏗 Build
Create the package output in `dist/`:

```bash
pnpm build
```

This runs the packaging pipeline (`svelte-package`) and copies shader/script assets into `dist/`.

## 📦 Use in a Host Project
1) Add the dependency:
```bash
pnpm add github:DauRagnarokas/svelte-image-particles#main
```

2) Configure Vite to load shaders (see **Host Project Setup**).

3) Import the component and pass an image path:
```svelte
<script>
  import { ParticlesCanvas } from 'svelte-image-particles';
</script>

<ParticlesCanvas imageSrc="/images/your-image.png" />
```

## 📂 Project Structure
```
src/lib
 ├── ParticlesCanvas.svelte   # main exported component
 ├── scripts/                 # JS helpers
 └── shaders/                 # GLSL shaders (.vert / .frag)
```

## 📜 License
MIT © DauRagnarokas
