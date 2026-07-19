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
const auditForm = dialog?.querySelector("[data-audit-form]");
const formSteps = [...(dialog?.querySelectorAll("[data-form-step]") || [])];
const progressSteps = [...(dialog?.querySelectorAll("[data-progress-step]") || [])];
const formSuccess = dialog?.querySelector("[data-form-success]");
let activeFormStep = 0;

const showFormStep = (index) => {
  activeFormStep = Math.max(0, Math.min(index, formSteps.length - 1));
  formSteps.forEach((step, stepIndex) => { step.hidden = stepIndex !== activeFormStep; });
  progressSteps.forEach((step, stepIndex) => {
    step.classList.toggle("is-current", stepIndex === activeFormStep);
    step.classList.toggle("is-complete", stepIndex < activeFormStep);
    if (stepIndex === activeFormStep) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
};

const resetAuditForm = () => {
  auditForm?.reset();
  auditForm?.removeAttribute("hidden");
  if (formSuccess) formSuccess.hidden = true;
  const error = auditForm?.querySelector("[data-form-error]");
  if (error) error.hidden = true;
  showFormStep(0);
};

document.querySelectorAll("[data-open-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    resetAuditForm();
    transition(() => dialog?.showModal());
  });
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => transition(() => dialog?.close()));
});
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) transition(() => dialog.close());
});

formSteps.forEach((step, index) => {
  step.querySelector("[data-next-step]")?.addEventListener("click", () => {
    const fields = [...step.querySelectorAll("input, select, textarea")];
    const invalidField = fields.find((field) => !field.checkValidity());
    if (invalidField) {
      invalidField.reportValidity();
      return;
    }
    transition(() => showFormStep(index + 1));
    formSteps[index + 1]?.querySelector("input, select, textarea")?.focus();
  });
  step.querySelector("[data-prev-step]")?.addEventListener("click", () => {
    transition(() => showFormStep(index - 1));
    formSteps[index - 1]?.querySelector("input, select, textarea")?.focus();
  });
});

dialog?.querySelectorAll("[data-date-input]").forEach((input) => {
  input.min = new Intl.DateTimeFormat("en-CA").format(new Date());
});
const formUrl = auditForm?.querySelector("[data-form-url]");
if (formUrl) formUrl.value = window.location.href;

auditForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auditForm.reportValidity()) return;

  const submitButton = auditForm.querySelector("[data-submit-button]");
  const error = auditForm.querySelector("[data-form-error]");
  const originalLabel = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = "Sending request…";
  error.hidden = true;

  try {
    const response = await fetch(auditForm.dataset.ajaxAction, {
      method: "POST",
      body: new FormData(auditForm),
      headers: { Accept: "application/json" },
    });
    const result = await response.json();
    if (!response.ok || result.success === false) throw new Error("Submission failed");
    transition(() => {
      auditForm.hidden = true;
      formSuccess.hidden = false;
      formSuccess.querySelector("h3")?.focus?.();
    });
  } catch {
    error.hidden = false;
    error.focus?.();
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalLabel;
  }
});

showFormStep(0);

document.querySelector("[data-year]").textContent = new Date().getFullYear();

class TopographicShader {
  constructor(canvas) {
    this.canvas = canvas;
    const options = {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
    };
    this.gl = canvas.getContext("webgl2", options) || canvas.getContext("webgl", options);
    this.isWebGL2 = typeof WebGL2RenderingContext !== "undefined" && this.gl instanceof WebGL2RenderingContext;
    this.frame = 0;
    this.start = performance.now();
    this.visible = true;
    this.pointerTarget = [0.72, 0.5];
    this.pointerCurrent = [...this.pointerTarget];
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
  }

  init() {
    if (!this.gl || motionQuery.matches || navigator.connection?.saveData) return false;
    const vertex = this.isWebGL2 ? `#version 300 es
      in vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    ` : `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;
    const fragmentBody = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 pointer;

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
        float elevation = fbm(p * 3.0 + vec2(drift, -drift * .4));
        elevation += .34 * fbm(p * 7.0 - vec2(drift * .5, 0.));
        float contours = line(elevation * 11.0, .045);
        float major = line(elevation * 3.0, .022);

        float coast = smoothstep(.06, .0, abs(
          p.x - (.22 + .25 * sin(p.y * 2.2) - .08 * cos(p.y * 5.4))
        ));
        float vignette = smoothstep(.9, .18, length(p - vec2(.14, .03)));
        float rightFade = smoothstep(.18, .68, uv.x);
        float cursorField = exp(-5.5 * distance(uv, pointer));

        vec2 nodeGrid = p * 8.0;
        vec2 nodeCell = fract(nodeGrid) - .5;
        float nodeSeed = step(.87, hash(floor(nodeGrid)));
        float nodes = smoothstep(.075, .0, length(nodeCell)) * nodeSeed * vignette;
        float nodeGlow = smoothstep(.26, .0, length(nodeCell)) * nodeSeed * vignette;

        float wave = sin((p.x * .7 + p.y) * 18.0 - time * .35 + elevation * 3.0);
        wave = smoothstep(.92, 1.0, wave) * .12 * vignette * rightFade;

        vec3 navy = vec3(.008, .024, .09);
        vec3 blue = vec3(.025, .32, .44);
        vec3 cyan = vec3(.13, .83, .93);
        vec3 color = navy;
        color += blue * elevation * .25 * rightFade;
        color += cyan * contours * (.13 + cursorField * .09) * vignette * rightFade;
        color += cyan * major * .22 * vignette * rightFade;
        color += cyan * coast * (.2 + cursorField * .12) * vignette * rightFade;
        color += cyan * (nodes * .72 + nodeGlow * .07 + wave);

        float dust = step(.9975, hash(floor(gl_FragCoord.xy / 4.0)));
        color += cyan * dust * .38 * vignette * rightFade;
        OUTPUT_COLOR = vec4(color, 1.0);
      }
    `;
    const fragment = this.isWebGL2
      ? `#version 300 es\n${fragmentBody.replace("precision highp float;", "precision highp float;\nout vec4 outputColor;").replace("OUTPUT_COLOR", "outputColor")}`
      : fragmentBody.replace("OUTPUT_COLOR", "gl_FragColor");

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
    this.pointer = this.gl.getUniformLocation(this.program, "pointer");

    this.observer = new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; }, { threshold: 0 });
    this.observer.observe(this.canvas);
    window.addEventListener("resize", this.resize, { passive: true });
    this.canvas.closest(".hero")?.addEventListener("pointermove", (event) => {
      const bounds = this.canvas.getBoundingClientRect();
      this.pointerTarget = [
        (event.clientX - bounds.left) / bounds.width,
        1 - (event.clientY - bounds.top) / bounds.height,
      ];
    }, { passive: true });
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
      this.pointerCurrent[0] += (this.pointerTarget[0] - this.pointerCurrent[0]) * .045;
      this.pointerCurrent[1] += (this.pointerTarget[1] - this.pointerCurrent[1]) * .045;
      this.gl.useProgram(this.program);
      this.gl.uniform2f(this.resolution, this.canvas.width, this.canvas.height);
      this.gl.uniform1f(this.time, (now - this.start) / 1000);
      this.gl.uniform2f(this.pointer, ...this.pointerCurrent);
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

const hero = document.querySelector(".hero");
hero?.addEventListener("pointermove", (event) => {
  const bounds = hero.getBoundingClientRect();
  hero.style.setProperty("--pointer-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
  hero.style.setProperty("--pointer-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
}, { passive: true });

if (window.matchMedia("(pointer: fine)").matches && !motionQuery.matches) {
  document.querySelectorAll("[data-tilt]").forEach((stage) => {
    stage.addEventListener("pointermove", (event) => {
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      stage.style.setProperty("--tilt-x", `${y * -5}deg`);
      stage.style.setProperty("--tilt-y", `${x * 7}deg`);
    }, { passive: true });
    stage.addEventListener("pointerleave", () => {
      stage.style.setProperty("--tilt-x", "0deg");
      stage.style.setProperty("--tilt-y", "-3deg");
    });
  });

  document.querySelectorAll("[data-spotlight]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
      card.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
    }, { passive: true });
  });
}
