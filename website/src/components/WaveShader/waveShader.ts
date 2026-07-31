const VERT = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uDpr;

out vec4 fragColor;

const vec3 BG = vec3(0.980, 0.933, 0.824);
const vec3 COL_PILL = vec3(0.176, 0.161, 0.149);

const float BAR_STEP = 0.26;
const float SCROLL_SPEED = 1.35;
const float PEAK_WIDTH = 2.35;
const float FALLOFF_POW = 3.6;

float hash11(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

float sdPill(vec2 p, float halfLen, float radius) {
  p.y = abs(p.y) - halfLen;
  return length(vec2(p.x, max(p.y, 0.0))) - radius;
}

const float PHONE_ASPECT = 0.48;
const float PHONE_ISLAND_HY = 0.095;
const float PHONE_HOME_HY = 0.055;
const float PHONE_ISLAND_GAP = 2.4;
const float PHONE_HOME_GAP = 2.6;

float phoneStroke(vec2 halfSize) {
  return max(1.6, halfSize.x * 0.085);
}

// Bezel + island + home bar — clear display sits between island and home.
float phoneChromeY(vec2 halfSize) {
  float stroke = phoneStroke(halfSize);
  float iy = halfSize.x * PHONE_ISLAND_HY;
  float hy = halfSize.x * PHONE_HOME_HY;
  return 2.0 * stroke + (PHONE_ISLAND_GAP + 1.0) * iy + (PHONE_HOME_GAP + 1.0) * hy;
}

float sampleNormal(float u1, float u2, float mu, float sigma) {
  float r = sqrt(-2.0 * log(max(u1, 1e-4)));
  float theta = 6.2831853 * u2;
  return mu + sigma * r * cos(theta);
}

// Peak amp on [0,1]: silent / 60+ / 80+, louder lean + silent anti-streak.
float peakAmp(float cell) {
  float pick = hash11(cell + 17.0);
  float prev = hash11(cell - 1.0 + 17.0);
  float silentThresh = prev < 0.16 ? 0.06 : 0.16;
  float u1 = hash11(cell * 1.913 + 91.0);
  float u2 = hash11(cell * 2.417 + 53.0);

  float mu;
  float sigma;
  if (pick < silentThresh) {
    mu = 0.15;
    sigma = 0.05;
  } else if (pick < 0.42) {
    mu = 0.66;
    sigma = 0.07;
  } else {
    mu = 0.84;
    sigma = 0.07;
  }
  return clamp(sampleNormal(u1, u2, mu, sigma), 0.0, 1.0);
}

float peakFalloff(float dist) {
  float t = clamp(dist, 0.0, 1.0);
  return pow(1.0 - t, FALLOFF_POW);
}

float mountainField(float x) {
  float p = x / PEAK_WIDTH;
  float c = floor(p);
  float f = fract(p);
  float h0 = peakAmp(c) * peakFalloff(f);
  float h1 = peakAmp(c + 1.0) * peakFalloff(1.0 - f);
  return max(h0, h1);
}

void main() {
  vec2 p = gl_FragCoord.xy / uDpr;
  float cssW = uResolution.x / uDpr;
  float cssH = uResolution.y / uDpr;

  float pitch = max(14.0, cssW / 48.0);
  float barW = pitch * 0.58;
  float radius = barW * 0.5;

  // Phone size unchanged (clear display sized to original full pillar).
  float pillarH = cssH * 0.34 * 2.0;
  float phoneH = pillarH * 1.2;
  float phoneW = phoneH * PHONE_ASPECT;
  vec2 phoneHalf = vec2(phoneW, phoneH) * 0.5;
  phoneH = pillarH + phoneChromeY(phoneHalf);
  phoneW = phoneH * PHONE_ASPECT;
  phoneHalf = vec2(phoneW, phoneH) * 0.5;
  phoneH = pillarH + phoneChromeY(phoneHalf);
  phoneW = phoneH * PHONE_ASPECT;
  phoneHalf = vec2(phoneW, phoneH) * 0.5;
  vec2 phoneC = vec2(cssW * 0.5, cssH * 0.5);

  // Clear display bounds (below island, above home bar).
  float stroke = phoneStroke(phoneHalf);
  float iy = phoneHalf.x * PHONE_ISLAND_HY;
  float hy = phoneHalf.x * PHONE_HOME_HY;
  float displayTop = phoneC.y + phoneHalf.y - stroke - iy * (PHONE_ISLAND_GAP + 1.0);
  float displayBot = phoneC.y - phoneHalf.y + stroke + hy * (PHONE_HOME_GAP + 1.0);
  float displayMid = 0.5 * (displayTop + displayBot);

  // Wave fits the top half of the clear display — no island overflow.
  float waveCenterY = 0.5 * (displayTop + displayMid);
  float maxHalf = 0.5 * (displayTop - displayMid);
  float barIndex = floor(p.x / pitch);
  float localX = (fract(p.x / pitch) - 0.5) * pitch;
  float x = barIndex * BAR_STEP + uTime * SCROLL_SPEED;
  float level = clamp(mountainField(x), 0.0, 1.0);
  float halfLen = max(0.0, level * maxHalf - radius);
  float d = sdPill(vec2(localX, p.y - waveCenterY), halfLen, radius);
  float cover = 1.0 - smoothstep(-1.0, 1.0, d);
  vec3 col = mix(BG, COL_PILL, cover);

  fragColor = vec4(col, 1.0);
}
`

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'unknown'
    gl.deleteShader(shader)
    throw new Error(info)
  }
  return shader
}

export type WaveShaderHandle = {
  destroy: () => void
}

export function mountWaveShader(
  canvas: HTMLCanvasElement,
): WaveShaderHandle | null {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    powerPreference: 'low-power',
  })
  if (!gl) return null

  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  const program = gl.createProgram()
  if (!program) {
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return null
  }
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return null
  }
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  )
  const loc = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const uResolution = gl.getUniformLocation(program, 'uResolution')
  const uTime = gl.getUniformLocation(program, 'uTime')
  const uDpr = gl.getUniformLocation(program, 'uDpr')

  let raf = 0
  let start = performance.now()
  let sizeDirty = true
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  const applySize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const bw = Math.max(1, Math.floor(w * dpr))
    const bh = Math.max(1, Math.floor(h * dpr))
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw
      canvas.height = bh
    }
    gl.viewport(0, 0, bw, bh)
    gl.uniform2f(uResolution, bw, bh)
    gl.uniform1f(uDpr, dpr)
    sizeDirty = false
  }

  const onResize = () => {
    sizeDirty = true
  }
  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(onResize)
      : null
  ro?.observe(canvas)
  window.addEventListener('resize', onResize)

  const frame = (now: number) => {
    if (sizeDirty) applySize()
    const t = reduceMotion.matches ? 0 : (now - start) / 1000
    gl.uniform1f(uTime, t)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    raf = requestAnimationFrame(frame)
  }

  applySize()
  raf = requestAnimationFrame(frame)

  return {
    destroy: () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener('resize', onResize)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
