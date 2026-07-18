import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const js = await readFile(new URL("../app.js", import.meta.url), "utf8");

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
