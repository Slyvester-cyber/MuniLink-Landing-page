import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CONTACT_EMAIL, FORM_ENDPOINT, FIELDS, readIntake, validateIntake,
  buildEmailBody, buildMailtoUrl, submitIntake,
} from "../form.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const html = await read("index.html");
const checklist = await read("checklist.html");
const privacy = await read("privacy.html");
const css = await read("styles.css");
const js = await read("app.js");
const logoSvg = await readFile(new URL("../assets/munilink-logo.svg", import.meta.url));
const logoPng = await readFile(new URL("../assets/munilink-logo.png", import.meta.url));

const validIntake = {
  name: "Thandi Nkosi", role: "SCM Manager", municipality: "Example Local Municipality",
  email: "thandi@example.gov.za", workflow: "SCM award files", milestone: "Interim audit, November",
  gap: "Missing MBD 4 forms", callTime: "Tuesday morning, Teams", consent: "yes",
};

test("page exposes a single h1 with the positioning line and labelled primary navigation", () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<h1[^>]*>Audit evidence, ready <em>before the auditors arrive\.<\/em><\/h1>/);
  assert.match(html, /<nav[^>]+aria-label="Primary navigation"/);
});

test("all in-page navigation targets exist and linked pages ship with the site", () => {
  const targets = [...html.matchAll(/href="#([^"]+)"/g)].map(([, target]) => target);
  for (const target of new Set(targets)) {
    assert.match(html, new RegExp(`id="${target}"`), `Missing #${target}`);
  }
  for (const page of [html, checklist, privacy]) {
    for (const [, file] of page.matchAll(/href="([a-z-]+\.html)/g)) {
      assert.ok(["index.html", "checklist.html", "privacy.html"].includes(file), `Unknown page ${file}`);
    }
  }
});

test("funnel sections: three pains, how it works, checklist offer and intake form", () => {
  for (const id of ["problem", "approach", "checklist", "evidence", "intake"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /SCM award files/);
  assert.match(html, /<small>Records<\/small>/);
  assert.match(html, /<small>Approvals<\/small>/);
  assert.match(html, /Discovery call[\s\S]*One bounded workflow[\s\S]*Evidence map &amp; findings[\s\S]*Next action/);
  assert.match(html, /href="checklist\.html"/);
});

test("copy follows the playbook: no AI lead, no prices, no promised outcomes", () => {
  assert.doesNotMatch(html, /\bAI\b/);
  assert.doesNotMatch(html, /R\s?\d[\d,.]*\s?(k|000)/i);
  assert.match(html, /No audit outcomes promised/);
  assert.match(html, /no public price list/i);
});

test("the dead 'contact channel almost ready' modal is gone", () => {
  assert.doesNotMatch(html, /<dialog/);
  assert.doesNotMatch(html, /almost ready/i);
  assert.doesNotMatch(js, /showModal/);
});

test("intake form has every required field, labels and a POPIA consent checkbox", () => {
  for (const name of ["name", "role", "municipality", "email", "workflow", "milestone", "gap", "callTime", "consent"]) {
    assert.match(html, new RegExp(`name="${name}"`), `Missing field ${name}`);
  }
  for (const id of ["f-name", "f-role", "f-municipality", "f-email", "f-milestone", "f-calltime", "f-gap"]) {
    assert.match(html, new RegExp(`<label for="${id}"`), `Missing label for ${id}`);
  }
  for (const value of ["SCM award files", "Records", "Approvals", "Other"]) {
    assert.match(html, new RegExp(`name="workflow" value="${value}"`));
  }
  assert.match(html, /type="checkbox" name="consent"[^>]*required/);
  assert.match(html, /href="privacy\.html"/);
  assert.match(html, /data-intake-thanks hidden/);
  assert.match(html, /data-intake-thanks[\s\S]*href="checklist\.html"/);
});

test("validation flags missing required fields, bad email and missing consent", () => {
  assert.deepEqual(validateIntake(validIntake), {});
  const errors = validateIntake(readIntake([["email", "not-an-email"]]));
  for (const name of ["name", "role", "municipality", "workflow", "consent"]) assert.ok(errors[name], `expected error for ${name}`);
  assert.match(errors.email, /valid email/);
  assert.ok(validateIntake({ ...validIntake, gap: "x".repeat(281) }).gap);
  assert.equal(validateIntake({ ...validIntake, milestone: "", gap: "", callTime: "" }).milestone, undefined);
});

test("mailto URL is prefilled with every field and addressed to MuniLink", () => {
  assert.equal(CONTACT_EMAIL, "munilink.agency@gmail.com");
  const url = buildMailtoUrl(validIntake);
  assert.ok(url.startsWith("mailto:munilink.agency@gmail.com?subject="));
  const body = decodeURIComponent(url.split("&body=")[1]);
  for (const field of FIELDS.filter((f) => f.name !== "consent")) {
    assert.ok(body.includes(`: ${validIntake[field.name]}`), `body missing ${field.name}`);
  }
  assert.match(buildEmailBody(validIntake), /POPIA consent: Yes/);
});

test("FORM_ENDPOINT switch: mailto by default, POST when an endpoint is set", async () => {
  assert.equal(FORM_ENDPOINT, "");
  const local = await submitIntake(validIntake);
  assert.equal(local.method, "mailto");
  let call;
  const fakeFetch = async (url, options) => { call = { url, options }; return { ok: true }; };
  const remote = await submitIntake(validIntake, { endpoint: "https://formspree.io/f/test", fetchImpl: fakeFetch });
  assert.equal(remote.method, "endpoint");
  assert.ok(remote.ok);
  assert.equal(call.url, "https://formspree.io/f/test");
  assert.equal(JSON.parse(call.options.body).municipality, validIntake.municipality);
});

test("checklist page holds 15 items and is hedged as guidance", () => {
  assert.equal((checklist.match(/class="check-item"/g) || []).length, 15);
  assert.match(checklist, /Guidance, not legal advice/);
  assert.match(checklist, /Regulation|Reg \d+/);
});

test("every page has a description plus Open Graph and Twitter tags", () => {
  for (const page of [html, checklist, privacy]) {
    assert.match(page, /<meta name="description" content="[^"]{50,}"/);
    for (const prop of ["og:title", "og:description", "og:image", "og:type"]) assert.match(page, new RegExp(`property="${prop}"`));
    assert.match(page, /name="twitter:card" content="summary_large_image"/);
  }
});

test("motion and rendering have accessible fallbacks", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.terrain\s*\{\s*display:\s*none/);
  assert.match(js, /getContext\("webgl2"/);
  assert.match(js, /getContext\("webgl"/);
  assert.match(js, /navigator\.connection\?\.saveData/);
});

test("supplied MuniLink branding is used with a resilient image fallback", () => {
  assert.ok(logoSvg.length > 0);
  assert.ok(logoPng.length > 0);
  assert.match(html, /srcset="assets\/munilink-logo\.svg"/);
  assert.match(html, /src="assets\/munilink-logo\.png"/);
  assert.match(html, /rel="icon" href="assets\/munilink-logo\.png"/);
});
