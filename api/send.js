// Simple serverless handler to relay CRM captures via Resend
// Expects POST JSON: { payload: { /* form fields */ } }
// Requires environment variable RESEND_API_KEY

const fetch = globalThis.fetch;
const fs = require('fs');
const path = require('path');

let db = null;

function sanitize(text) {
  return String(text ?? '')
    .replace(/[<>]/g, '')
    .trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

try {
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = path.join(__dirname, '..', 'data', 'leads.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      business TEXT,
      vertical TEXT,
      budget TEXT,
      notes TEXT,
      fit TEXT,
      agree TEXT,
      gateway TEXT,
      package_name TEXT,
      timestamp TEXT,
      user_agent TEXT,
      viewport TEXT,
      payload_json TEXT NOT NULL
    );
  `);
} catch (_err) {
  // On serverless targets (e.g., Vercel), sqlite/local disk may be unavailable.
  db = null;
}

function persistLead(payload) {
  if (!db) return false;
  const statement = db.prepare(`
    INSERT INTO leads (
      created_at, full_name, email, phone, business, vertical, budget, notes, fit,
      agree, gateway, package_name, timestamp, user_agent, viewport, payload_json
    ) VALUES (
      @created_at, @full_name, @email, @phone, @business, @vertical, @budget, @notes, @fit,
      @agree, @gateway, @package_name, @timestamp, @user_agent, @viewport, @payload_json
    )
  `);

  statement.run({
    created_at: new Date().toISOString(),
    full_name: sanitize(payload.fullName),
    email: sanitize(payload.email),
    phone: sanitize(payload.phone),
    business: sanitize(payload.business),
    vertical: sanitize(payload.vertical),
    budget: sanitize(payload.budget),
    notes: sanitize(payload.notes),
    fit: sanitize(payload.fit),
    agree: sanitize(payload.agree),
    gateway: sanitize(payload.gateway),
    package_name: sanitize(payload.package),
    timestamp: sanitize(payload.timestamp),
    user_agent: sanitize(payload.userAgent),
    viewport: sanitize(payload.viewport),
    payload_json: JSON.stringify(payload)
  });

  return true;
}

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return;
  }
  try {
    if (typeof fetch !== 'function') {
      res.statusCode = 500; res.end(JSON.stringify({ error: 'Native fetch is unavailable in this runtime' })); return;
    }
    let body = '';
    for await (const chunk of req) body += chunk;
    const json = JSON.parse(body || '{}');
    const payload = json.payload || {};
    if (!payload.fullName || !isValidEmail(payload.email)) {
      res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing or invalid required fields' })); return;
    }

    const persisted = persistLead(payload);

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, emailSent: false, storedOnly: persisted, persisted }));
      return;
    }

    const toEmail = process.env.RESEND_TO || 'jasonm@veleorta.resend.app';
    const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
    const subject = `New Ownership request — ${sanitize(payload.fullName)}`;
    const html = `
      <h3>New request captured</h3>
      <p><strong>Name:</strong> ${sanitize(payload.fullName)}</p>
      <p><strong>Email:</strong> ${sanitize(payload.email)}</p>
      <p><strong>Gateway:</strong> ${sanitize(payload.gateway)}</p>
      <p><strong>Package:</strong> ${sanitize(payload.package)}</p>
      <p><strong>Budget:</strong> ${sanitize(payload.budget)}</p>
      <p><strong>Goal:</strong></p>
      <pre>${sanitize(payload.notes)}</pre>
      <hr />
      <p><strong>Context:</strong></p>
      <pre>${sanitize(JSON.stringify(payload, null, 2))}</pre>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: `Ownership <${fromEmail}>`,
        to: toEmail,
        subject,
        html
      })
    });

    if (!r.ok) {
      const text = await r.text();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, emailSent: false, storedOnly: persisted, persisted, resendStatus: r.status, resendBody: text }));
      return;
    }

    res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({ ok: true, emailSent: true }));
  } catch (err) {
    res.statusCode = 500; res.end(JSON.stringify({ error: err.message }));
  }
};
