import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'newsletter-subscribers.json');

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

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }
    const list = readSubscribers();
    if (list.some(s => s.email === email)) {
      return NextResponse.json({ message: 'Déjà inscrit' }, { status: 200 });
    }
    list.push({ email, date: new Date().toISOString() });
    writeSubscribers(list);
    return NextResponse.json({ message: 'Inscrit avec succès' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
