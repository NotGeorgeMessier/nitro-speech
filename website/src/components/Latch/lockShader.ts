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
uniform float uLift;
uniform float uTurn;
uniform float uOpen;

out vec4 fragColor;

/* Cream glyph on the inverted ink stamp. */
const vec3 INK = vec3(0.98, 0.933, 0.824);
const float PI = 3.14159265;

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// Upright shackle in local XY — free end at −X, hinge at +X (right post).
float sdShackleLocal(vec2 p, float halfW, float height, float tube) {
  vec2 left = vec2(-halfW, 0.0);
  vec2 right = vec2(halfW, 0.0);
  vec2 crownC = vec2(0.0, height - halfW);
  float posts = min(
    sdCapsule(p, left, left + vec2(0.0, height - halfW), tube),
    sdCapsule(p, right, right + vec2(0.0, height - halfW), tube)
  );
  vec2 pc = p - crownC;
  float ring = abs(length(pc) - halfW) - tube;
  ring = max(ring, -pc.y);
  return min(posts, ring);
}

float coverFromDist(float d) {
  float w = max(fwidth(d), 1e-4) * 0.85;
  return 1.0 - smoothstep(-w, w, d);
}

float mapLock(vec2 g, float lift, float turn) {
  // Pad — fixed (facing camera).
  vec2 bodyC = vec2(0.0, -0.20);
  vec2 bp = g - bodyC;
  float body = sdRoundBox(bp, vec2(0.32, 0.26), 0.09);

  vec2 kh = bp - vec2(0.0, 0.02);
  float hole = sdCircle(kh - vec2(0.0, 0.05), 0.05);
  float slot = sdCapsule(kh, vec2(0.0, 0.02), vec2(0.0, -0.12), 0.028);
  body = max(body, -min(hole, slot));

  // XZ turn around the right post (Y). Free end in XZ:
  //   turn 0 → (−1, 0)  locked
  //   turn ½ → ( 0, 1)  toward camera
  //   turn 1 → ( 1, 0)  open
  float turnT = clamp(turn, 0.0, 1.0);
  // Ease the mid-swing so foreshortening spends less time near edge-on.
  float phi = turnT * turnT * (3.0 - 2.0 * turnT) * PI;
  float c = cos(phi);

  float halfW = 0.19;
  float height = 0.4;
  float tube = 0.056;
  vec2 shOrigin = vec2(0.0, 0.06);
  vec2 pivot = shOrigin + vec2(halfW, 0.0);

  // Lift clears the pad before the free end swings; a touch of extra
  // rise through mid-turn keeps the post from clipping the body.
  float clear = lift * 0.24 + sin(turnT * PI) * 0.045;
  vec2 p = g - pivot;
  p.y -= clear;

  float shackle;
  float absC = abs(c);
  // Soften the edge-on handoff so the hinge post doesn't pop.
  float edge = smoothstep(0.0, 0.12, absC);
  float hingePost = sdCapsule(p, vec2(0.0), vec2(0.0, height), tube);

  if (absC < 0.02) {
    shackle = hingePost;
  } else {
    vec2 local = vec2(p.x / c + halfW, p.y);
    float dLocal = sdShackleLocal(local, halfW, height, tube);
    float foreshortened = dLocal * absC;
    shackle = mix(hingePost, foreshortened, edge);
  }

  return min(body, shackle);
}

void main() {
  vec2 frag = gl_FragCoord.xy / uDpr;
  float cssW = max(uResolution.x / uDpr, 1.0);
  float cssH = max(uResolution.y / uDpr, 1.0);
  float extent = 0.5 * min(cssW, cssH);

  float lift = clamp(uLift, -0.08, 1.25);
  float turn = clamp(uTurn, 0.0, 1.0);
  float open = clamp(uOpen, 0.0, 1.0);

  // Barely-there idle when open — settled metal, not a bob.
  turn = clamp(turn + open * 0.006 * sin(uTime * 1.35), 0.0, 1.0);

  vec2 center = 0.5 * vec2(cssW, cssH);
  // Fill the lock cell; keep a little air from the ink border.
  vec2 q = (frag - center) / extent * 0.92;
  q.y += 0.015 + max(lift, 0.0) * 0.018;

  float aa = 0.5 / extent;
  float d =
    (mapLock(q, lift, turn) +
     mapLock(q + vec2(-0.3, 0.1) * aa, lift, turn) +
     mapLock(q + vec2(0.1, 0.3) * aa, lift, turn) +
     mapLock(q + vec2(0.3, -0.1) * aa, lift, turn) +
     mapLock(q + vec2(-0.1, -0.3) * aa, lift, turn)) *
    0.2;

  fragColor = vec4(INK, coverFromDist(d) * 0.94);
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

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

function clamp01(v: number) {
  return clamp(v, 0, 1)
}

/** Critically-ish damped spring — snappy without long oscillation. */
function springStep(
  pos: number,
  vel: number,
  target: number,
  dt: number,
  stiffness: number,
  damping: number,
): [number, number] {
  const accel = (target - pos) * stiffness - vel * damping
  const nextVel = vel + accel * dt
  const nextPos = pos + nextVel * dt
  return [nextPos, nextVel]
}

function near(a: number, b: number, eps = 0.012) {
  return Math.abs(a - b) < eps
}

type Phase = 'idle' | 'lift' | 'swing' | 'drop' | 'settle'

/** Resting open height — just clear of the body, not floating. */
const OPEN_LIFT = 0.52
/** Peak lift while the free end clears the pad. */
const CLEAR_LIFT = 0.92

export type LockShaderHandle = {
  setLocked: (locked: boolean) => void
  destroy: () => void
}

/**
 * Padlock: unlock lifts clear then swings open; lock swings shut then seats.
 * Motion is phase-driven springs so mid-gesture toggles stay continuous.
 */
export function mountLockShader(
  canvas: HTMLCanvasElement,
): LockShaderHandle | null {
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
  const uLift = gl.getUniformLocation(program, 'uLift')
  const uTurn = gl.getUniformLocation(program, 'uTurn')
  const uOpen = gl.getUniformLocation(program, 'uOpen')

  let raf = 0
  let sizeDirty = true
  let alive = true
  let looping = false
  let locked = false
  let phase: Phase = 'idle'
  let lift = OPEN_LIFT
  let turn = 1
  let open = 1
  let liftV = 0
  let turnV = 0
  let liftTarget = OPEN_LIFT
  let turnTarget = 1
  let lastNow = performance.now()
  const clock0 = lastNow
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  const snapTo = (nextLocked: boolean) => {
    locked = nextLocked
    phase = 'idle'
    liftV = 0
    turnV = 0
    if (nextLocked) {
      lift = 0
      turn = 0
      open = 0
      liftTarget = 0
      turnTarget = 0
    } else {
      lift = OPEN_LIFT
      turn = 1
      open = 1
      liftTarget = OPEN_LIFT
      turnTarget = 1
    }
  }

  const applySize = (): boolean => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w =
      canvas.clientWidth ||
      canvas.width ||
      parseFloat(getComputedStyle(canvas).width) ||
      48
    const h =
      canvas.clientHeight ||
      canvas.height ||
      parseFloat(getComputedStyle(canvas).height) ||
      48
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

  const settled = () =>
    phase === 'idle' &&
    near(lift, liftTarget, 0.008) &&
    near(turn, turnTarget, 0.008) &&
    Math.abs(liftV) < 0.02 &&
    Math.abs(turnV) < 0.02

  const advancePhases = () => {
    if (locked) {
      // Lock: swing shut while held high → drop into pad → soft seat.
      if (phase === 'swing' && turn < 0.1 && Math.abs(turnV) < 0.35) {
        phase = 'drop'
        liftTarget = -0.045
        open = 0
      } else if (phase === 'drop' && lift < 0.04) {
        phase = 'settle'
        liftTarget = 0
      } else if (
        phase === 'settle' &&
        near(lift, 0, 0.01) &&
        Math.abs(liftV) < 0.08
      ) {
        phase = 'idle'
        lift = 0
        liftV = 0
        turn = 0
        turnV = 0
        open = 0
      }
    } else {
      // Unlock: clear the pad → swing open → settle low over the body.
      if (phase === 'lift' && lift > 0.55) {
        phase = 'swing'
        turnTarget = 1
        liftTarget = CLEAR_LIFT
      } else if (
        phase === 'swing' &&
        turn > 0.97 &&
        Math.abs(turnV) < 0.12
      ) {
        phase = 'idle'
        liftTarget = OPEN_LIFT
        open = 1
      }
    }
  }

  const stepMotion = (dt: number) => {
    if (phase === 'idle' && settled()) return false

    // Lift is a bit softer (mass); swing is quicker once free.
    const liftStiff = phase === 'drop' || phase === 'settle' ? 180 : 140
    const liftDamp = phase === 'settle' ? 22 : 18
    const turnStiff = 115
    const turnDamp = 16

    ;[lift, liftV] = springStep(
      lift,
      liftV,
      liftTarget,
      dt,
      liftStiff,
      liftDamp,
    )
    ;[turn, turnV] = springStep(
      turn,
      turnV,
      turnTarget,
      dt,
      turnStiff,
      turnDamp,
    )

    lift = clamp(lift, -0.08, 1.25)
    turn = clamp01(turn)
    advancePhases()

    if (!locked && phase === 'idle') {
      open = clamp01(open + dt * 4)
    } else if (locked) {
      open = clamp01(open - dt * 8)
    }

    return !settled() || (!locked && !reduceMotion.matches)
  }

  const draw = (now: number) => {
    if (sizeDirty) applySize()

    const rawDt = (now - lastNow) / 1000
    lastNow = now
    const dt = reduceMotion.matches ? 1 : clamp(rawDt, 0, 0.032)
    if (!reduceMotion.matches) stepMotion(dt)

    gl.uniform1f(uLift, lift)
    gl.uniform1f(uTurn, turn)
    gl.uniform1f(uOpen, open)
    gl.uniform1f(uTime, (now - clock0) / 1000)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  const stopLoop = () => {
    if (!looping) return
    cancelAnimationFrame(raf)
    raf = 0
    looping = false
  }

  const frame = (now: number) => {
    if (!alive) return
    draw(now)
    const keep =
      !settled() || (!locked && open > 0.5 && !reduceMotion.matches)
    if (keep) {
      raf = requestAnimationFrame(frame)
    } else {
      looping = false
      raf = 0
    }
  }

  const kick = () => {
    if (!alive || looping) return
    looping = true
    lastNow = performance.now()
    raf = requestAnimationFrame(frame)
  }

  const paintStatic = () => {
    sizeDirty = true
    applySize()
    lastNow = performance.now()
    draw(lastNow)
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

  paintStatic()
  if (!reduceMotion.matches) kick()
  requestAnimationFrame(() => {
    if (alive && !looping) paintStatic()
  })

  return {
    setLocked: (next: boolean) => {
      if (reduceMotion.matches) {
        snapTo(next)
        paintStatic()
        return
      }

      if (next === locked && phase === 'idle' && settled()) {
        if (!looping) paintStatic()
        return
      }

      locked = next
      if (next) {
        // Swing closed first; hold shackle clear until aligned.
        phase = 'swing'
        turnTarget = 0
        liftTarget = Math.max(lift, CLEAR_LIFT)
        open = Math.min(open, 0.4)
      } else {
        // Lift clear of the pad before swinging.
        phase = 'lift'
        liftTarget = CLEAR_LIFT
        turnTarget = turn
        open = 0
      }
      kick()
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
