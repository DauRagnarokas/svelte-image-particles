// src/shaders/particle.vert
precision highp float;

attribute float pindex;
attribute vec3 position;
attribute vec3 offset;
attribute vec2 uv;
attribute float angle;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float uTime;
uniform float uRandom;
uniform float uDepth;
uniform float uSize;
uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform sampler2D uTouch;

varying vec2 vPUv;
varying vec2 vUv;

float random(float n) { return fract(sin(n) * 43758.5453123); }

// ---- inline 2D simplex noise (Ashima, public domain) ----
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
float snoise_1_2(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0) )
                  + i.x + vec3(0.0, i1.x, 1.0) );
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x * x0.x   + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
// --------------------------------------------------------

void main() {
  vUv = uv;

  // pixel center
  vec2 puv = (offset.xy + 0.5) / uTextureSize;
  vPUv = puv;

  // source color & alpha
  vec4 s = texture2D(uTexture, puv);
  float grey = dot(s.rgb, vec3(0.21, 0.71, 0.07));
  float a    = s.a;

  // displacement
  vec3 displaced = offset;

  // jitter scales with alpha
  float jitterAmp = uRandom * clamp(a, 0.0, 1.0);
  displaced.xy += vec2(
    (random(pindex) - 0.5),
    (random(offset.x + pindex) - 0.5)
  ) * jitterAmp;

  float rndz = (random(pindex) + snoise_1_2(vec2(pindex * 0.1, uTime * 0.1)));
  displaced.z += rndz * (random(pindex) * 2.0 * uDepth);

  // center in view
  displaced.xy -= uTextureSize * 0.5;

  // touch displacement, also scale with alpha
  float t = texture2D(uTouch, puv).r * clamp(a, 0.0, 1.0);
  displaced.z += t * 20.0 * rndz;
  displaced.x += cos(angle) * t * 20.0 * rndz;
  displaced.y += sin(angle) * t * 20.0 * rndz;

  // size modulation
  float psize = (snoise_1_2(vec2(uTime, pindex) * 0.5) + 2.0);
  float invGrey = 1.0 - grey;
  psize *= max(invGrey, 0.2);
  psize *= max(a, 0.15);      // semi-transparent pixels → smaller dots
  psize *= uSize;

  // final position
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  mvPosition.xyz += position * psize;
  gl_Position = projectionMatrix * mvPosition;
}
