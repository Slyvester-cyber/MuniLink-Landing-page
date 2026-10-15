import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CONTACT_EMAIL, FORM_ENDPOINT, FIELDS, BOOKING_URL, readIntake, validateIntake,
  buildEmailBody, buildMailtoUrl, submitIntake, buildIntakePayload, bookingLinkAttributes,
  validateChecklistRequest, buildChecklistPayload, submitChecklistRequest,
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

test("FORM_ENDPOINT posts JSON to FormSubmit's AJAX endpoint with control fields", async () => {
  assert.equal(FORM_ENDPOINT, "https://formsubmit.co/ajax/munilink.agency@gmail.com");
  let call;
  const fakeFetch = async (url, options) => { call = { url, options }; return { ok: true, json: async () => ({ success: "true" }) }; };
  const result = await submitIntake(validIntake, { fetchImpl: fakeFetch });
  assert.deepEqual([result.method, result.ok], ["endpoint", true]);
  assert.equal(call.url, FORM_ENDPOINT);
  assert.equal(call.options.method, "POST");
  assert.equal(call.options.headers["Content-Type"], "application/json");
  assert.equal(call.options.headers.Accept, "application/json");
  const body = JSON.parse(call.options.body);
  assert.equal(body._subject, "New MuniLink discovery request \u2013 Example Local Municipality");
  assert.equal(body._template, "table");
  assert.equal(body._captcha, "false");
  assert.equal(body._honey, "");
  assert.equal(body.Municipality, validIntake.municipality);
  assert.equal(body.email, validIntake.email);
  assert.match(body["POPIA consent"], /^Yes/);
  assert.equal(buildIntakePayload(validIntake)["Workflow area"], "SCM award files");
});

test("intake falls back to the prefilled mailto when the request fails or is rejected", async () => {
  const offline = await submitIntake(validIntake, { fetchImpl: async () => { throw new TypeError("Failed to fetch"); } });
  assert.deepEqual([offline.method, offline.fallback], ["mailto", true]);
  assert.ok(offline.url.startsWith("mailto:munilink.agency@gmail.com?subject="));
  const serverError = await submitIntake(validIntake, { fetchImpl: async () => ({ ok: false }) });
  assert.equal(serverError.method, "mailto");
  const notActivated = await submitIntake(validIntake, { fetchImpl: async () => ({ ok: true, json: async () => ({ success: "false", message: "This form needs Activation." }) }) });
  assert.equal(notActivated.method, "mailto");
  const noEndpoint = await submitIntake(validIntake, { endpoint: "" });
  assert.equal(noEndpoint.method, "mailto");
});

test("intake form carries a hidden honeypot and no longer says it only opens email", () => {
  assert.match(html, /class="hp-field" aria-hidden="true"[\s\S]*?name="_honey"[^>]*tabindex="-1"/);
  assert.doesNotMatch(html, /This opens your email app with your details filled in/);
  assert.match(js, /submitIntake/);
});

test("BOOKING_URL constant drives every 'Book a 20-minute call' button", () => {
  assert.equal(typeof BOOKING_URL, "string");
  assert.ok(BOOKING_URL === "#intake" || /^https:\/\//.test(BOOKING_URL), "BOOKING_URL must be #intake or an https URL");
  const heroActions = html.match(/<div class="hero-actions">[\s\S]*?<\/div>/)[0];
  assert.match(heroActions, /data-booking>Book a 20-minute call/);
  const thanksBlock = html.slice(html.indexOf("data-intake-thanks"));
  assert.match(thanksBlock, /data-booking>Book a 20-minute call/);
  assert.match(js, /\[data-booking\]/);
  assert.deepEqual(bookingLinkAttributes("#intake"), { href: "#intake" });
  assert.deepEqual(bookingLinkAttributes("https://cal.com/munilink/20min"), { href: "https://cal.com/munilink/20min", target: "_blank", rel: "noopener noreferrer" });
});

test("checklist capture form is optional, POPIA-consented and never gates the 15 items", async () => {
  assert.match(checklist, /Email me the printable version and updates when AGSA guidance changes/);
  const formHtml = checklist.match(/<form class="capture-form"[\s\S]*?<\/form>/)[0];
  for (const name of ["name", "email", "municipality", "consent", "_honey"]) assert.match(formHtml, new RegExp(`name="${name}"`));
  assert.match(formHtml, /type="checkbox" name="consent"[^>]*required/);
  assert.equal((checklist.match(/class="check-item"/g) || []).length, 15);
  assert.doesNotMatch(checklist, /check-item[^"]*"[^>]*hidden/);
  assert.ok(validateChecklistRequest({ name: "", email: "x", municipality: "", consent: "" }).consent);
  assert.deepEqual(validateChecklistRequest({ name: "A", email: "a@b.gov.za", municipality: "M", consent: "yes" }), {});
  const payload = buildChecklistPayload({ name: "A", email: "a@b.gov.za", municipality: "Kouga", consent: "yes" });
  assert.equal(payload._subject, "Checklist request \u2013 Kouga");
  assert.equal(payload._template, "table");
  let url;
  const ok = await submitChecklistRequest({ name: "A", email: "a@b.gov.za", municipality: "Kouga", consent: "yes" }, { fetchImpl: async (u) => { url = u; return { ok: true, json: async () => ({ success: "true" }) }; } });
  assert.equal(ok.method, "endpoint");
  assert.equal(url, FORM_ENDPOINT);
  const failed = await submitChecklistRequest({ name: "A", email: "a@b.gov.za", municipality: "Kouga", consent: "yes" }, { fetchImpl: async () => { throw new Error("offline"); } });
  assert.equal(failed.method, "mailto");
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
