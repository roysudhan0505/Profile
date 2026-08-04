/**
 * Google Apps Script — Contact Form Backend
 * ==========================================
 * Receives JSON POST requests (from a Vercel serverless function) and
 * appends validated submissions to a Google Sheet.
 *
 * DEPLOYMENT
 * 1. Open the target Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Delete any starter code, paste this entire file in.
 * 4. (Optional) change SHEET_NAME below.
 * 5. Deploy > New deployment > Select type: "Web app".
 *      - Execute as:      Me
 *      - Who has access:  Anyone
 * 6. Copy the Web App URL (ends in /exec). That is GOOGLE_SCRIPT_URL.
 * 7. Visit that URL directly in a browser — you should get back
 *    {"success":true,"message":"Contact form endpoint is live.", ...}
 *    That confirms the deployment itself is working before anything
 *    on the Vercel side is wired up.
 *
 * IMPORTANT: any time you edit this file, you must create a NEW
 * deployment (or push a new version under "Manage deployments"),
 * otherwise the live /exec URL keeps serving the old code.
 */

const SHEET_NAME = "Responses";

const HEADERS = ["Timestamp", "Name", "Email", "Subject", "Message"];

const LIMITS = {
  name: { min: 2, max: 100 },
  email: { min: 5, max: 150 },
  subject: { min: 2, max: 150 },
  message: { min: 10, max: 5000 }
};

/**
 * Handles POST requests — the only way submissions are written.
 */
function doPost(e) {
  try {
    const data = parseRequestBody(e);

    if (data.error) {
      return jsonResponse({ success: false, message: data.error }, 400);
    }

    const validation = validateSubmission(data.payload);

    if (!validation.valid) {
      return jsonResponse({ success: false, message: validation.message }, 400);
    }

    appendSubmission(validation.data);

    return jsonResponse({
      success: true,
      message: "Message stored successfully."
    }, 200);

  } catch (error) {
    // Never leak internal error details to the caller.
    console.error(error);
    return jsonResponse({
      success: false,
      message: "Unexpected server error. Please try again later."
    }, 500);
  }
}

/**
 * Handles GET requests — used as a simple health check, e.g. to confirm
 * the deployment is live before wiring up the Vercel backend.
 */
function doGet() {
  return jsonResponse({
    success: true,
    message: "Contact form endpoint is live.",
    timestamp: new Date().toISOString()
  }, 200);
}

/* ============================================================
   REQUEST PARSING
   ============================================================ */

function parseRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return { error: "No request body received." };
  }

  try {
    const payload = JSON.parse(e.postData.contents);

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { error: "Request body must be a JSON object." };
    }

    return { payload: payload };

  } catch (parseError) {
    return { error: "Request body is not valid JSON." };
  }
}

/* ============================================================
   VALIDATION
   ============================================================ */

function validateSubmission(payload) {
  const name = sanitize(payload.name);
  const email = sanitize(payload.email);
  const subject = sanitize(payload.subject);
  const message = sanitize(payload.message);

  if (!name || !email || !subject || !message) {
    return { valid: false, message: "All fields (name, email, subject, message) are required." };
  }

  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    return { valid: false, message: "Name must be between " + LIMITS.name.min + " and " + LIMITS.name.max + " characters." };
  }

  if (!isValidEmail(email) || email.length > LIMITS.email.max) {
    return { valid: false, message: "Please provide a valid email address." };
  }

  if (subject.length < LIMITS.subject.min || subject.length > LIMITS.subject.max) {
    return { valid: false, message: "Subject must be between " + LIMITS.subject.min + " and " + LIMITS.subject.max + " characters." };
  }

  if (message.length < LIMITS.message.min || message.length > LIMITS.message.max) {
    return { valid: false, message: "Message must be between " + LIMITS.message.min + " and " + LIMITS.message.max + " characters." };
  }

  return {
    valid: true,
    data: { name: name, email: email, subject: subject, message: message }
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Trims whitespace, coerces to string, and strips characters that could
 * be interpreted as the start of a spreadsheet formula (=, +, -, @),
 * which protects against CSV/formula-injection when the sheet is later
 * exported or opened elsewhere.
 */
function sanitize(value) {
  if (value === null || value === undefined) return "";

  var str = value.toString().trim();

  if (/^[=+\-@]/.test(str)) {
    str = "'" + str;
  }

  return str;
}

/* ============================================================
   SHEET ACCESS
   ============================================================ */

/**
 * Appends a row using a script lock to prevent two near-simultaneous
 * submissions from writing over each other / racing on header creation.
 */
function appendSubmission(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // wait up to 10s for the lock

  try {
    const sheet = getOrCreateSheet();

    sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.subject,
      data.message
    ]);

  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  ensureHeaders(sheet);

  return sheet;
}

/**
 * Writes the header row if the sheet is empty (first run).
 */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
}

/* ============================================================
   RESPONSE HELPERS
   ============================================================ */

/**
 * Note: Apps Script's ContentService cannot set a custom HTTP status
 * code — it always returns 200 at the transport level. The numeric
 * `status` argument here is kept for readability/intent; the calling
 * backend (Vercel) should branch on the `success` field in the JSON
 * body rather than the transport status code.
 */
function jsonResponse(body, status) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
