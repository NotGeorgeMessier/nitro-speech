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
uniform float uEnergy;
uniform float uPressed;

out vec4 fragColor;

const vec3 INK = vec3(0.176, 0.161, 0.149);

// Soft filled disc.
float disc(float dist, float r) {
  return 1.0 - smoothstep(r - 0.55, r + 0.55, dist);
}

// Soft ring of radius r and stroke width w (in CSS px).
float ring(float dist, float r, float w) {
  return smoothstep(w, 0.0, abs(dist - r));
}

// Dense circumferential ripple — stays round (low lobe count reads as a hexagon).
float waveRadius(float angle, float baseR, float amp, float t) {
  float w =
    0.50 * sin(angle * 12.0 - t * 5.4)
    + 0.32 * sin(angle * 18.0 + t * 7.2)
    + 0.18 * sin(angle * 28.0 - t * 3.8);
  return baseR + amp * w;
}

// Idle: clean circle only. Hover: dancing circumference.
// Pressed (focused row): center radio dot appears.
void main() {
  vec2 p = gl_FragCoord.xy / uDpr;
  float cssW = max(uResolution.x / uDpr, 1.0);
  float cssH = max(uResolution.y / uDpr, 1.0);
  float e = clamp(uEnergy, 0.0, 1.0);
  float pr = clamp(uPressed, 0.0, 1.0);

  // Canvas center — keep peak radius inside the box so amplitude doesn't clip
  // and look like a vertical/horizontal offset.
  vec2 center = 0.5 * vec2(cssW, cssH);
  vec2 d = p - center;
  float dist = length(d);
  // "half" is reserved in GLSL — use extent instead.
  float extent = 0.5 * min(cssW, cssH);
  float stroke = extent * mix(0.11, 0.14, e);
  float amp = extent * 0.22 * e;
  float baseR = extent - stroke - amp - 0.5;
  float angle = atan(d.y, d.x);

  // Core appears only when the row is pressed/focused.
  float coreR = extent * 0.16;
  float core = disc(dist, coreR) * pr;

  float t = uTime;
  float rimR = mix(baseR, waveRadius(angle, baseR, amp, t), e);
  float rim = ring(dist, rimR, stroke);

  float cover = max(core, rim);
  float alpha = cover * mix(0.72, 1.0, max(e, pr));
  fragColor = vec4(INK, alpha);
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

export type MarkShaderHandle = {
  setEnergy: (energy: number) => void
  setPressed: (pressed: number) => void
  destroy: () => void
}

/**
 * Circle glyph. Hover dances the circumference; pressed shows the center dot.
 * rAF only runs while energy/pressed are transitioning or active.
 */
export function mountMarkShader(
  canvas: HTMLCanvasElement,
): MarkShaderHandle | null {
  // Straight alpha — matches blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA).
  // (premultipliedAlpha:true + that blend was washing the idle glyph out.)
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
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
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

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
  const uEnergy = gl.getUniformLocation(program, 'uEnergy')
  const uPressed = gl.getUniformLocation(program, 'uPressed')

  let raf = 0
  let start = 0
  let sizeDirty = true
  let targetEnergy = 0
  let energy = 0
  let targetPressed = 0
  let pressed = 0
  let alive = true
  let looping = false
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  const applySize = (): boolean => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    // Prefer laid-out CSS size; fall back to attribute / style so the first
    // paint isn't a blank 1×1 before layout.
    const w =
      canvas.clientWidth ||
      canvas.width ||
      parseFloat(getComputedStyle(canvas).width) ||
      24
    const h =
      canvas.clientHeight ||
      canvas.height ||
      parseFloat(getComputedStyle(canvas).height) ||
      24
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
    return w >= 2 && h >= 2
  }

  const draw = (now: number) => {
    if (sizeDirty) applySize()

    const rate = reduceMotion.matches ? 1 : 0.14
    energy += (targetEnergy - energy) * rate
    if (Math.abs(targetEnergy - energy) < 0.002) energy = targetEnergy
    pressed += (targetPressed - pressed) * rate
    if (Math.abs(targetPressed - pressed) < 0.002) pressed = targetPressed

    const e = reduceMotion.matches ? targetEnergy : energy
    const pr = reduceMotion.matches ? targetPressed : pressed
    const t = reduceMotion.matches || e <= 0 ? 0 : (now - start) / 1000

    gl.uniform1f(uTime, t)
    gl.uniform1f(uEnergy, e)
    gl.uniform1f(uPressed, pr)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    return Math.max(e, pr)
  }

  const stopLoop = () => {
    if (!looping) return
    cancelAnimationFrame(raf)
    raf = 0
    looping = false
  }

  const busy = () =>
    targetEnergy > 0 ||
    energy > 0 ||
    targetPressed > 0 ||
    pressed > 0

  const frame = (now: number) => {
    if (!alive) return
    draw(now)
    if (busy()) {
      raf = requestAnimationFrame(frame)
    } else {
      draw(now)
      looping = false
      raf = 0
    }
  }

  const kick = () => {
    if (!alive || looping) return
    looping = true
    if (targetEnergy > 0 && energy <= 0) start = performance.now()
    raf = requestAnimationFrame(frame)
  }

  const paintStatic = () => {
    sizeDirty = true
    applySize()
    draw(performance.now())
  }

  const onResize = () => {
    sizeDirty = true
    if (!looping) paintStatic()
  }
  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(onResize)
      : null
  ro?.observe(canvas)

  // Paint once now; ResizeObserver repaints when layout settles.
  paintStatic()
  // Extra kick after the first layout frame — covers SSR/hydration races
  // where clientWidth is still 0 during the mount effect.
  requestAnimationFrame(() => {
    if (alive && !looping) paintStatic()
  })

  return {
    setEnergy: (next: number) => {
      const clamped = Math.min(1, Math.max(0, next))
      if (clamped > 0 && targetEnergy <= 0) {
        start = performance.now()
      }
      targetEnergy = clamped
      if (busy() || clamped > 0) kick()
      else if (!looping) paintStatic()
    },
    setPressed: (next: number) => {
      targetPressed = Math.min(1, Math.max(0, next))
      if (busy() || targetPressed > 0) kick()
      else if (!looping) paintStatic()
    },
    destroy: () => {
      alive = false
      stopLoop()
      ro?.disconnect()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
