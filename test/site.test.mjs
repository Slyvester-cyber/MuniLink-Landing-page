import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const js = await readFile(new URL("../app.js", import.meta.url), "utf8");
const server = await readFile(new URL("../scripts/server.mjs", import.meta.url), "utf8");
const logoSvg = await readFile(new URL("../assets/munilink-logo.svg", import.meta.url));
const logoPng = await readFile(new URL("../assets/munilink-logo.png", import.meta.url));
const localFonts = await Promise.all([
  "inter/inter-latin.woff2",
  "inter/inter-latin-ext.woff2",
  "outfit/outfit-latin.woff2",
  "outfit/outfit-latin-ext.woff2",
].map((file) => readFile(new URL(`../assets/fonts/${file}`, import.meta.url))));

test("page exposes a single h1 and labelled primary navigation", () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<nav[^>]+aria-label="Primary navigation"/);
});

test("all in-page navigation targets exist", () => {
  const targets = [...html.matchAll(/href="#([^"]+)"/g)].map(([, target]) => target);
  for (const target of new Set(targets)) {
    assert.match(html, new RegExp(`id="${target}"`), `Missing #${target}`);
  }
});

test("motion and rendering have accessible fallbacks", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.terrain\s*\{\s*display:\s*none/);
  assert.match(js, /getContext\("webgl2"/);
  assert.match(js, /getContext\("webgl"/);
  assert.match(js, /navigator\.connection\?\.saveData/);
});

test("key page sections and honest qualifiers are present", () => {
  for (const id of ["approach", "services", "evidence", "pricing", "contact"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /In progress/);
  assert.match(html, /Public pricing has not yet been published/);
  assert.match(html, /has not been provided yet/);
});

test("decision lens explains the audit gates without unsupported claims", () => {
  assert.match(html, /class="page-shell decision-lens/);
  assert.match(html, /Is the need specific\?/);
  assert.match(html, /Are the conditions real\?/);
  assert.match(html, /Can people stay accountable\?/);
});

test("supplied MuniLink branding is used with a resilient image fallback", () => {
  assert.ok(logoSvg.length > 0);
  assert.ok(logoPng.length > 0);
  assert.match(html, /srcset="assets\/munilink-logo\.svg"/);
  assert.match(html, /src="assets\/munilink-logo\.png"/);
  assert.match(html, /rel="icon" href="assets\/munilink-logo\.png"/);
});

test("brand fonts are self-hosted with swap and system fallbacks", () => {
  assert.ok(localFonts.every((font) => font.length > 0));
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/);
  assert.match(html, /rel="preload" href="assets\/fonts\/inter\/inter-latin\.woff2"/);
  assert.match(html, /rel="preload" href="assets\/fonts\/outfit\/outfit-latin\.woff2"/);
  assert.match(css, /font-family:\s*"Inter";[\s\S]*?font-display:\s*swap;[\s\S]*?inter-latin\.woff2/);
  assert.match(css, /font-family:\s*"Outfit";[\s\S]*?font-display:\s*swap;[\s\S]*?outfit-latin\.woff2/);
  assert.match(css, /--display:\s*"Outfit",\s*system-ui,\s*sans-serif/);
  assert.match(css, /--body:\s*"Inter",\s*system-ui,\s*sans-serif/);
  assert.match(server, /"\.woff2":\s*"font\/woff2"/);
});
