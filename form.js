// Intake form logic for the MuniLink discovery-call form.
// Pure functions (no DOM access) so they can be unit tested with `node --test`.

export const CONTACT_EMAIL = "munilink.agency@gmail.com";

// Leave empty to use the no-backend mailto flow.
// To switch to a form service later, paste its endpoint here, e.g.
//   Formspree:    "https://formspree.io/f/abcdwxyz"   (JSON POST)
//   Google Forms: "https://docs.google.com/forms/d/e/<FORM_ID>/formResponse"
//                 and fill GOOGLE_FORM_ENTRY_IDS with each question's entry id.
export const FORM_ENDPOINT = "";

export const GOOGLE_FORM_ENTRY_IDS = {
  // name: "entry.1234567890",
};

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

/**
 * Submit the intake. With no endpoint it returns the mailto URL for the caller to open.
 * With an endpoint it POSTs (JSON for Formspree-style services, form-encoded for Google Forms).
 */
export async function submitIntake(data, { endpoint = FORM_ENDPOINT, fetchImpl = globalThis.fetch } = {}) {
  if (!endpoint) return { method: "mailto", ok: true, url: buildMailtoUrl(data) };

  if (endpoint.includes("docs.google.com/forms")) {
    const body = new URLSearchParams();
    for (const [name, entry] of Object.entries(GOOGLE_FORM_ENTRY_IDS)) body.append(entry, data[name] === true ? "Yes" : data[name] ?? "");
    await fetchImpl(endpoint, { method: "POST", mode: "no-cors", body });
    return { method: "endpoint", ok: true, url: buildMailtoUrl(data) };
  }

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...data, consent: Boolean(data.consent), _subject: buildSubject(data) }),
  });
  return { method: "endpoint", ok: Boolean(response?.ok), url: buildMailtoUrl(data) };
}
