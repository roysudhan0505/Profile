/**
 * POST /api/contact
 *
 * Server-side proxy between the portfolio contact form and the Google Apps
 * Script Web App that writes submissions into Google Sheets.
 *
 * Required environment variable (set in Vercel dashboard):
 *   GOOGLE_SCRIPT_URL  - the deployed Apps Script /exec URL
 *
 * Optional environment variable:
 *   ALLOWED_ORIGIN     - your production site origin, e.g.
 *                         https://your-portfolio.vercel.app
 *                         (localhost and the current Vercel deployment
 *                         are always allowed automatically)
 */

const FETCH_TIMEOUT_MS = 10000;

const DEV_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

function getAllowedOrigins() {
    const allowed = [...DEV_ORIGINS];

    if (process.env.ALLOWED_ORIGIN) {
        allowed.push(process.env.ALLOWED_ORIGIN);
    }

    // Vercel automatically injects VERCEL_URL for the current deployment
    // (production and every preview) — this lets the current deployment
    // always call its own API without extra configuration.
    if (process.env.VERCEL_URL) {
        allowed.push(`https://${process.env.VERCEL_URL}`);
    }

    return allowed;
}

function isOriginAllowed(origin) {
    // No Origin header (e.g. some server-to-server tools) — let it through;
    // it is not how browsers behave, so this does not weaken browser-based
    // protection, it only avoids false positives on legitimate same-origin
    // requests that omit the header.
    if (!origin) return true;

    return getAllowedOrigins().includes(origin);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePayload(body) {
    if (!body || typeof body !== "object") {
        return "Invalid request body.";
    }

    const { name, email, subject, message, website } = body;

    // Honeypot field: real visitors never see or fill this input.
    // A non-empty value means the submission came from a bot.
    if (typeof website === "string" && website.trim().length > 0) {
        return "SPAM";
    }

    if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 100) {
        return "Please provide a valid name (3-100 characters).";
    }

    if (typeof email !== "string" || !isValidEmail(email.trim()) || email.trim().length > 150) {
        return "Please provide a valid email address.";
    }

    if (typeof subject !== "string" || subject.trim().length < 3 || subject.trim().length > 150) {
        return "Please provide a valid subject (3-150 characters).";
    }

    if (typeof message !== "string" || message.trim().length < 10 || message.trim().length > 5000) {
        return "Please provide a message between 10 and 5000 characters.";
    }

    return null;
}

async function forwardToGoogleSheets(payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        const text = await response.text();

        try {
            return JSON.parse(text);
        } catch {
            // Apps Script did not return JSON — treat any 2xx as success.
            return {
                success: response.ok,
                message: response.ok ? "Message stored." : "Unexpected response from Google Sheets."
            };
        }
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method Not Allowed"
        });
    }

    const origin = req.headers.origin;

    if (!isOriginAllowed(origin)) {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed."
        });
    }

    if (!process.env.GOOGLE_SCRIPT_URL) {
        console.error("Missing GOOGLE_SCRIPT_URL environment variable.");
        return res.status(500).json({
            success: false,
            message: "Server is not configured correctly."
        });
    }

    const validationError = validatePayload(req.body);

    if (validationError === "SPAM") {
        // Respond as if it succeeded so the bot has no signal it was caught,
        // but never forward the submission to Google Sheets.
        return res.status(200).json({
            success: true,
            message: "Message sent successfully."
        });
    }

    if (validationError) {
        return res.status(400).json({
            success: false,
            message: validationError
        });
    }

    const { name, email, subject, message } = req.body;

    try {
        const result = await forwardToGoogleSheets({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim()
        });

        if (result && result.success) {
            return res.status(200).json({
                success: true,
                message: "Message sent successfully."
            });
        }

        return res.status(502).json({
            success: false,
            message: (result && result.message) || "Unable to store your message right now."
        });

    } catch (error) {
        if (error.name === "AbortError") {
            console.error("Google Apps Script request timed out.");
            return res.status(504).json({
                success: false,
                message: "The request timed out. Please try again."
            });
        }

        console.error("Contact form error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to contact server."
        });
    }
};
