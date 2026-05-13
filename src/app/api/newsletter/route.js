import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'newsletter-subscribers.json');

/* ── Email validation ───────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ── In-memory rate limiting (per IP, 5 req/hour) ──────── */
const rateLimitMap = new Map();
const RATE_LIMIT   = 5;
const RATE_WINDOW  = 60 * 60 * 1000; // 1 hour ms

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, reset: now + RATE_WINDOW };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + RATE_WINDOW; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= RATE_LIMIT;
}

/* ── Allowed origins (CSRF guard) ──────────────────────── */
const ALLOWED_ORIGINS = [
  'https://palmeraies-tighremt-tata.vercel.app',
  'https://palmeries-tighremt.org',
  'http://localhost:3000',
];

function isOriginAllowed(req) {
  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  if (!origin) return true; // same-origin requests may have no Origin header
  return ALLOWED_ORIGINS.some(o => origin.startsWith(o));
}

/* ── File helpers ───────────────────────────────────────── */
function readSubscribers() {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch { return []; }
}

function writeSubscribers(list) {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

/* ── Route handler ──────────────────────────────────────── */
export async function POST(req) {
  try {
    // CSRF origin check
    if (!isOriginAllowed(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429 });
    }

    // Validate email
    const { email } = await req.json();
    if (!email || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const list = readSubscribers();

    if (list.some(s => s.email === normalized)) {
      return NextResponse.json({ message: 'Déjà inscrit' }, { status: 200 });
    }

    list.push({ email: normalized, date: new Date().toISOString() });
    writeSubscribers(list);

    return NextResponse.json({ message: 'Inscrit avec succès' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
