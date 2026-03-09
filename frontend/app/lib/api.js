const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getSessions() {
  const res = await fetch(`${API_BASE}/sessions/`);
  if (!res.ok) throw new Error('Error obteniendo sesiones');
  return res.json();
}

export async function createSession(title = 'Nueva conversación') {
  const res = await fetch(`${API_BASE}/sessions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Error creando sesión');
  return res.json();
}

export async function getSession(id) {
  const res = await fetch(`${API_BASE}/sessions/${id}/`);
  if (!res.ok) throw new Error('Error obteniendo sesión');
  return res.json();
}

export async function deleteSession(id) {
  const res = await fetch(`${API_BASE}/sessions/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando sesión');
}

export async function renameSession(id, title) {
  const res = await fetch(`${API_BASE}/sessions/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Error renombrando sesión');
  return res.json();
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function sendMessage(sessionId, message) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Error enviando mensaje');
  return res.json();
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getDocuments() {
  const res = await fetch(`${API_BASE}/documents/`);
  if (!res.ok) throw new Error('Error obteniendo documentos');
  return res.json();
}

export async function uploadDocument(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/documents/`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error subiendo documento');
  }
  return res.json();
}

export async function deleteDocument(id) {
  const res = await fetch(`${API_BASE}/documents/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error eliminando documento');
}
