svelte-image-particles

✨ A Svelte component for rendering interactive particle systems from images, powered by Three.js
 and GLSL shaders.

🚀 Features

Render images as particle fields

Smooth interactive motion

Built with Svelte 5 + Three.js

Customizable shaders for advanced effects

📦 Installation

You can install directly from GitHub (no npm publish required):

pnpm add github:DauRagnarokas/svelte-image-particles#main


For stable releases, use a tagged version instead of #main:

pnpm add github:DauRagnarokas/svelte-image-particles#v0.0.1

🛠 Consumer Setup

Because this library uses GLSL shaders (.vert / .frag files), you need to configure Vite to handle them.

Option 1 — Minimal (recommended)

Add this to your vite.config.ts:

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

Option 2 — With plugin (alternative)

Install vite-plugin-glsl
:

pnpm add -D vite-plugin-glsl


And in vite.config.ts:

import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()]
});

🎨 Usage

In your Svelte component:

<script>
  import { ParticlesCanvas } from 'svelte-image-particles';
</script>

<section class="relative h-screen bg-black">
  <!-- Pass your image as a prop -->
  <ParticlesCanvas image="/images/logo.png" />
</section>

⚙️ Props
Prop	Type	Default	Description
image	string	null	Path/URL to the image to convert to particles
width	number	auto	Canvas width
height	number	auto	Canvas height

(More props will be added as customization grows — e.g., particle size, density, interactivity strength.)

📂 Project Structure
src/lib
 ├── ParticlesCanvas.svelte   # main exported component
 ├── scripts/                 # JS helpers
 └── shaders/                 # GLSL shaders (.vert / .frag)

📜 License

MIT © DauRagnarokas
