// Intake form logic for the MuniLink discovery-call form.
// Pure functions (no DOM access) so they can be unit tested with `node --test`.

export const CONTACT_EMAIL = "munilink.agency@gmail.com";

// Form backend: FormSubmit's AJAX endpoint (free, no account). Submissions arrive in
// CONTACT_EMAIL. Set to "" to fall back to the no-backend mailto flow.
export const FORM_ENDPOINT = "https://formsubmit.co/ajax/munilink.agency@gmail.com";

// Booking link for "Book a 20-minute call" buttons. Paste the Cal.com URL here when it is ready,
// e.g. "https://cal.com/munilink/20min". Until then it points at the intake form on this page.
export const BOOKING_URL = "#intake";

/** Attributes for a booking link: external URLs open in a new tab, in-page anchors do not. */
export function bookingLinkAttributes(url = BOOKING_URL) {
  const external = /^https?:\/\//i.test(url);
  return external ? { href: url, target: "_blank", rel: "noopener noreferrer" } : { href: url };
}

export const FIELDS = [
  { name: "name", label: "Name", required: true },
  { name: "role", label: "Role", required: true },
  { name: "municipality", label: "Municipality", required: true },
  { name: "email", label: "Work email", required: true, type: "email" },
  { name: "workflow", label: "Workflow area", required: true, options: ["SCM award files", "Records", "Approvals", "Other"] },
  { name: "milestone", label: "Next audit milestone", required: false },
  { name: "gap", label: "Biggest evidence gap", required: false, maxLength: 280 },
  { name: "callTime", label: "Preferred call time", required: false },
  { name: "consent", label: "POPIA consent", required: true, type: "checkbox" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Turn FormData (or any iterable of [key, value]) into a trimmed plain object. */
export function readIntake(entries) {
  const data = {};
  for (const [key, value] of entries) data[key] = typeof value === "string" ? value.trim() : value;
  for (const field of FIELDS) if (!(field.name in data)) data[field.name] = "";
  return data;
}

/** Returns an object of { fieldName: message } for every invalid field (empty object = valid). */
export function validateIntake(data) {
  const errors = {};
  for (const field of FIELDS) {
    const value = data[field.name] ?? "";
    if (field.required && (value === "" || value === false)) {
      errors[field.name] = field.type === "checkbox"
        ? "Please tick the box so we can use your details to reply."
        : field.options ? "Please choose a workflow area." : `Please enter your ${field.label.toLowerCase()}.`;
      continue;
    }
    if (field.type === "email" && value && !EMAIL_PATTERN.test(value)) errors[field.name] = "Please enter a valid email address, like name@municipality.gov.za.";
    if (field.options && value && !field.options.includes(value)) errors[field.name] = "Please choose a workflow area.";
    if (field.maxLength && value.length > field.maxLength) errors[field.name] = `Please keep this under ${field.maxLength} characters.`;
  }
  return errors;
}

export function buildSubject(data) {
  return `Discovery call request: ${data.municipality || "municipality"} (${data.workflow || "workflow"})`;
}

export function buildEmailBody(data) {
  const line = (label, value) => `${label}: ${value || "-"}`;
  return [
    "Hello Slyvester,",
    "",
    "I'd like to book a 20-minute discovery call (Teams or phone).",
    "",
    line("Name", data.name),
    line("Role", data.role),
    line("Municipality", data.municipality),
    line("Work email", data.email),
    line("Workflow area", data.workflow),
    line("Next audit milestone", data.milestone),
    line("Biggest evidence gap", data.gap),
    line("Preferred call time", data.callTime),
    "",
    `POPIA consent: ${data.consent ? "Yes, I agree that MuniLink may use these details to respond to my enquiry." : "Not given"}`,
    "",
    "Sent from the MuniLink discovery-call form.",
  ].join("\n");
}

export function buildMailtoUrl(data, to = CONTACT_EMAIL) {
  const query = `subject=${encodeURIComponent(buildSubject(data))}&body=${encodeURIComponent(buildEmailBody(data))}`;
  return `mailto:${to}?${query}`;
}

/** FormSubmit control fields shared by every form on the site. */
export function formSubmitControls(subject) {
  return { _subject: subject, _template: "table", _captcha: "false", _honey: "" };
}

export function buildFormSubmitSubject(data) {
  return `New MuniLink discovery request – ${data.municipality || "municipality"}`;
}

/** JSON body for the FormSubmit AJAX endpoint. */
export function buildIntakePayload(data) {
  const payload = {};
  for (const field of FIELDS) {
    if (field.name === "consent") continue;
    payload[field.label] = data[field.name] || "-";
  }
  payload["POPIA consent"] = data.consent ? "Yes, I agree that MuniLink may use these details to respond to my enquiry." : "Not given";
  payload.email = data.email; // FormSubmit uses "email" as the reply-to address
  return { ...payload, ...formSubmitControls(buildFormSubmitSubject(data)), _honey: data._honey || "" };
}

/** POST JSON to a FormSubmit-style endpoint. Resolves true only when the service confirms success. */
export async function postJson(endpoint, payload, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response?.ok) return false;
  try {
    const json = await response.json();
    return json?.success === undefined ? true : String(json.success) === "true";
  } catch {
    return true;
  }
}

/**
 * Submit the intake. POSTs to FORM_ENDPOINT; if there is no endpoint, or the request fails,
 * returns the prefilled mailto URL so the caller can open the visitor's email app instead.
 */
export async function submitIntake(data, { endpoint = FORM_ENDPOINT, fetchImpl = globalThis.fetch } = {}) {
  const url = buildMailtoUrl(data);
  if (!endpoint) return { method: "mailto", ok: true, url };
  try {
    const ok = await postJson(endpoint, buildIntakePayload(data), fetchImpl);
    if (ok) return { method: "endpoint", ok: true, url };
  } catch {
    // network error, blocked request, etc. Fall through to mailto.
  }
  return { method: "mailto", ok: true, fallback: true, url };
}

// ---- Checklist capture (optional, never gates the checklist) ----

export const CHECKLIST_FIELDS = [
  { name: "name", label: "Name", required: true },
  { name: "email", label: "Work email", required: true, type: "email" },
  { name: "municipality", label: "Municipality", required: true },
  { name: "consent", label: "POPIA consent", required: true, type: "checkbox" },
];

export function validateChecklistRequest(data) {
  const errors = {};
  for (const field of CHECKLIST_FIELDS) {
    const value = data[field.name] ?? "";
    if (field.required && (value === "" || value === false)) {
      errors[field.name] = field.type === "checkbox"
        ? "Please tick the box so we can email you."
        : `Please enter your ${field.label.toLowerCase()}.`;
      continue;
    }
    if (field.type === "email" && value && !EMAIL_PATTERN.test(value)) errors[field.name] = "Please enter a valid email address, like name@municipality.gov.za.";
  }
  return errors;
}

export function buildChecklistPayload(data) {
  return {
    Name: data.name,
    "Work email": data.email,
    Municipality: data.municipality,
    Request: "Printable SCM award-file checklist + updates when AGSA guidance changes",
    "POPIA consent": data.consent ? "Yes, email me the checklist and occasional updates. I can unsubscribe at any time." : "Not given",
    email: data.email,
    ...formSubmitControls(`Checklist request – ${data.municipality || "municipality"}`),
    _honey: data._honey || "",
  };
}

export function buildChecklistMailtoUrl(data, to = CONTACT_EMAIL) {
  const subject = `Checklist request – ${data.municipality || "municipality"}`;
  const body = [
    "Hello Slyvester,",
    "",
    "Please email me the printable SCM award-file checklist and updates when AGSA guidance changes.",
    "",
    `Name: ${data.name || "-"}`,
    `Work email: ${data.email || "-"}`,
    `Municipality: ${data.municipality || "-"}`,
    `POPIA consent: ${data.consent ? "Yes" : "Not given"}`,
  ].join("\n");
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function submitChecklistRequest(data, { endpoint = FORM_ENDPOINT, fetchImpl = globalThis.fetch } = {}) {
  const url = buildChecklistMailtoUrl(data);
  if (!endpoint) return { method: "mailto", ok: true, url };
  try {
    if (await postJson(endpoint, buildChecklistPayload(data), fetchImpl)) return { method: "endpoint", ok: true, url };
  } catch {
    // fall through
  }
  return { method: "mailto", ok: true, fallback: true, url };
}
