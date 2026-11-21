import { useEffect, useRef } from 'react'
import { reduceMotion } from '../lib/util'

/**
 * Clear, shallow water seen at a low angle: a perspective-projected plane with
 * animated caustic light (two layers of moving Voronoi edges) over pale sand,
 * fading into a soft haze at the horizon. Rendered by a tiny WebGL shader at
 * reduced resolution and 30fps; it pauses whenever the hero is off screen.
 * A CSS gradient underneath is the fallback when WebGL is unavailable.
 */

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// distance between the nearest and second-nearest moving cell points:
// small along cell borders, which is where caustic light gathers
float cellEdge(vec2 x, float t) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.5 + 0.42 * sin(t + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; }
      else if (d < d2) { d2 = d; }
    }
  }
  return sqrt(d2) - sqrt(d1);
}

float caustic(vec2 p, float t, float w) {
  float e = cellEdge(p, t);
  float c = 1.0 - smoothstep(0.0, w, e);
  return c * c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float yy = 1.0 - uv.y;                 // 0 at the top (far), 1 at the bottom (near)
  float aspect = uRes.x / uRes.y;
  float t = uTime;

  // project the screen onto a tilted water plane
  float depth = mix(0.16, 1.0, pow(yy, 1.15));
  vec2 p = vec2((uv.x - 0.5) * aspect / depth, 1.0 / depth) * 1.6;

  // surface refraction: two octaves of wobble bend the light network organically
  vec2 w = vec2(sin(p.y * 2.3 + t * 0.7) + sin(p.x * 1.3 - t * 0.5) + 0.5 * sin(p.x * 4.1 + p.y * 3.3 + t),
                cos(p.x * 1.9 + t * 0.6) + sin(p.y * 1.1 + t * 0.4) + 0.5 * cos(p.y * 4.7 - p.x * 2.9 - t));
  vec2 q = p + w * 0.11;

  // two drifting layers; where they cross the light focuses and brightens, as real caustics do
  float c1 = caustic(q * 1.1 + vec2(t * 0.05, t * 0.03), t * 0.5, 0.09);
  float c2 = caustic(mat2(0.8, -0.6, 0.6, 0.8) * q * 1.55 - vec2(t * 0.04, -t * 0.02), t * 0.7 + 3.0, 0.09);
  float n = sin(p.x * 0.9 + t * 0.3) * sin(p.y * 0.7 - t * 0.2) * 0.5 + 0.5;
  float c = (c1 * 0.38 + c2 * 0.26 + c1 * c2 * 1.1) * mix(0.55, 1.0, n);

  // clear water over pale sand: shallow aqua near the bottom, lighter further away
  vec3 sand = vec3(0.93, 0.89, 0.78);
  vec3 shallow = vec3(0.60, 0.86, 0.84);
  vec3 deep = vec3(0.28, 0.67, 0.71);
  vec3 water = mix(shallow, deep, smoothstep(0.45, 1.0, yy));
  water = mix(water, sand, 0.16 * (1.0 - yy));

  // slow sky reflection bands on the surface
  float sheen = sin(p.x * 0.6 + p.y * 0.25 + t * 0.25) * 0.5 + 0.5;
  water += vec3(0.05, 0.06, 0.06) * sheen * (1.0 - yy * 0.6);

  vec3 col = water + vec3(1.0, 0.99, 0.94) * c * mix(0.12, 0.42, yy);

  // haze at the horizon so the title sits on a calm, bright area
  vec3 haze = vec3(0.957, 0.949, 0.918);
  col = mix(haze, col, smoothstep(0.12, 0.62, yy));

  // soft vignette at the bottom corners
  float v = smoothstep(1.25, 0.45, length((uv - vec2(0.5, 0.55)) * vec2(1.0, 1.3)));
  col *= mix(0.9, 1.0, v);

  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
}

export default function WaterGL() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    let raf = 0
    let alive = true
    let cleanup = () => {}

    const start = () => {
      if (!alive) return
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' })
      if (!gl) return
      const vs = compile(gl, gl.VERTEX_SHADER, VERT)
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
      if (!vs || !fs) return
      const prog = gl.createProgram()!
      gl.attachShader(prog, vs)
      gl.attachShader(prog, fs)
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
      gl.useProgram(prog)
      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'p')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      const uRes = gl.getUniformLocation(prog, 'uRes')
      const uTime = gl.getUniformLocation(prog, 'uTime')

      // render well below native resolution: water is soft, the GPU stays cool
      const resize = () => {
        const r = canvas.getBoundingClientRect()
        const scale = r.width < 700 ? 0.5 : 0.6
        canvas.width = Math.max(1, Math.round(r.width * scale))
        canvas.height = Math.max(1, Math.round(r.height * scale))
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.uniform2f(uRes, canvas.width, canvas.height)
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(canvas)

      let visible = true
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting
        if (visible && !raf) raf = requestAnimationFrame(frame)
      })
      io.observe(canvas)

      const t0 = performance.now()
      let last = 0
      const frame = (now: number) => {
        raf = 0
        if (!visible || document.hidden) return
        raf = requestAnimationFrame(frame)
        if (now - last < 32) return // ~30fps is plenty for slow water
        last = now
        gl.uniform1f(uTime, (now - t0) / 1000)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      // Without a real GPU (software rasteriser) a live shader would eat the CPU:
      // draw one still frame instead.
      const dbg = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
      const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer)
      if (reduceMotion || software) {
        gl.uniform1f(uTime, 12)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      } else raf = requestAnimationFrame(frame)
      canvas.classList.add('on')
      const onVis = () => { if (!document.hidden && visible && !raf && !reduceMotion) raf = requestAnimationFrame(frame) }
      document.addEventListener('visibilitychange', onVis)

      cleanup = () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        io.disconnect()
        document.removeEventListener('visibilitychange', onVis)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    }

    // start after first paint so the page shows instantly
    const idle = 'requestIdleCallback' in window
      ? window.requestIdleCallback(start, { timeout: 600 })
      : globalThis.setTimeout(start, 200)

    return () => {
      alive = false
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle as number)
      else globalThis.clearTimeout(idle as number)
      cleanup()
    }
  }, [])

  return <canvas ref={ref} className="water-gl" aria-hidden="true" />
}
