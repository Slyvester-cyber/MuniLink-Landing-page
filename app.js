const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const transition = (callback) => {
  if (document.startViewTransition && !motionQuery.matches) {
    document.startViewTransition(callback);
  } else {
    callback();
  }
};

const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-nav");

const syncHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 120);
window.addEventListener("scroll", syncHeader, { passive: true });
syncHeader();

menuButton?.addEventListener("click", () => {
  const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
  transition(() => {
    menuButton.setAttribute("aria-expanded", String(willOpen));
    navigation.classList.toggle("is-open", willOpen);
  });
});

navigation?.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuButton?.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  }
});

const dialog = document.querySelector("[data-dialog]");
document.querySelectorAll("[data-open-dialog]").forEach((button) => {
  button.addEventListener("click", () => transition(() => dialog?.showModal()));
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => transition(() => dialog?.close()));
});
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) transition(() => dialog.close());
});

document.querySelector("[data-year]").textContent = new Date().getFullYear();

class TopographicShader {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
    });
    this.frame = 0;
    this.start = performance.now();
    this.visible = true;
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
  }

  init() {
    if (!this.gl || motionQuery.matches) return false;
    const vertex = `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;
    const fragment = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
                   mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = .5;
        for (int i = 0; i < 4; i++) {
          value += amp * noise(p);
          p = p * 2.03 + vec2(13.1, 7.7);
          amp *= .5;
        }
        return value;
      }

      float line(float value, float width) {
        float d = abs(fract(value) - .5);
        return 1.0 - smoothstep(width, width + .035, d);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 p = (gl_FragCoord.xy - .5 * resolution.xy) / resolution.y;
        p.x += .15;

        float drift = time * .018;
        float elevation = fbm(p * 3.1 + vec2(drift, -drift * .4));
        elevation += .32 * fbm(p * 7.0 - vec2(drift * .5, 0.));
        float contours = line(elevation * 9.0, .055);
        float major = line(elevation * 3.0, .025);

        float coast = smoothstep(.06, .0, abs(
          p.x - (.22 + .25 * sin(p.y * 2.2) - .08 * cos(p.y * 5.4))
        ));
        float vignette = smoothstep(.9, .18, length(p - vec2(.14, .03)));
        float rightFade = smoothstep(.18, .68, uv.x);

        vec3 navy = vec3(.008, .024, .09);
        vec3 blue = vec3(.025, .32, .44);
        vec3 cyan = vec3(.13, .83, .93);
        vec3 color = navy;
        color += blue * elevation * .18 * rightFade;
        color += cyan * contours * .12 * vignette * rightFade;
        color += cyan * major * .17 * vignette * rightFade;
        color += cyan * coast * .14 * vignette * rightFade;

        float dust = step(.9975, hash(floor(gl_FragCoord.xy / 4.0)));
        color += cyan * dust * .32 * vignette * rightFade;
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compile = (type, source) => {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) return null;
      return shader;
    };
    const vs = compile(this.gl.VERTEX_SHADER, vertex);
    const fs = compile(this.gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return false;

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) return false;

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), this.gl.STATIC_DRAW);
    this.gl.useProgram(this.program);
    const position = this.gl.getAttribLocation(this.program, "position");
    this.gl.enableVertexAttribArray(position);
    this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);
    this.resolution = this.gl.getUniformLocation(this.program, "resolution");
    this.time = this.gl.getUniformLocation(this.program, "time");

    this.observer = new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; }, { threshold: 0 });
    this.observer.observe(this.canvas);
    window.addEventListener("resize", this.resize, { passive: true });
    document.addEventListener("visibilitychange", () => { this.visible = !document.hidden; });
    this.resize();
    this.render();
    return true;
  }

  resize() {
    const scale = Math.min(window.devicePixelRatio, 1.5);
    const width = Math.floor(this.canvas.clientWidth * scale);
    const height = Math.floor(this.canvas.clientHeight * scale);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  render(now = performance.now()) {
    if (this.visible) {
      this.gl.useProgram(this.program);
      this.gl.uniform2f(this.resolution, this.canvas.width, this.canvas.height);
      this.gl.uniform1f(this.time, (now - this.start) / 1000);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
    this.frame = requestAnimationFrame(this.render);
  }
}

const canvas = document.querySelector("#terrain");
if (canvas) {
  const shader = new TopographicShader(canvas);
  if (!shader.init()) document.documentElement.classList.add("shader-fallback");
}
