precision highp float;

uniform sampler2D uTexture;
uniform float uEdge;       // how wide the soft edge is (in [0..~0.5], smaller = sharper)
uniform float uSharpness;  // exponent for edge hardness (>= 1, larger = harder)

varying vec2 vPUv; // source pixel UV (which pixel this particle is tied to)
varying vec2 vUv;  // quad UV, used for round sprite mask

void main() {
  vec2 uv  = vUv;
  vec2 puv = vPUv;

  // sample source image (must carry alpha)
  vec4 src = texture2D(uTexture, puv);

  // Fully/near-fully transparent source pixels: no output
  if (src.a < 0.01) discard;

  // greyscale style (keep if you like the monochrome look)
  float grey = dot(src.rgb, vec3(0.21, 0.71, 0.07));
  vec4 colB = vec4(grey, grey, grey, 1.0);

  // circular mask for each particle, but with a much tighter edge
  // radius is 0.5 (quad is 1x1 centered), dist > 0 inside the circle
  float radius = 0.5;
  float dist = radius - distance(uv, vec2(0.5));

  // small edge + high exponent => crisp dot; still anti-aliased
  float t = smoothstep(0.0, uEdge, dist);
  t = pow(t, uSharpness);

  // final color: sprite alpha respects source alpha
  vec4 color = colB;
  color.a = t * src.a;

  // optional: hard clip to avoid faint halo outside super tiny dots
  if (color.a < 0.003) discard;

  gl_FragColor = color;
}
