// デプロイ後にWorkerのURLに書き換える
const WORKER_URL = 'http://localhost:8787';

export function getSecret() { return localStorage.getItem('worker_secret') || ''; }
export function setSecret(s) { localStorage.setItem('worker_secret', s); }

async function apiFetch(path, options = {}) {
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSecret()}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getContracts: () => apiFetch('/contracts'),
  createContract: (d) => apiFetch('/contracts', { method: 'POST', body: JSON.stringify(d) }),
  updateContract: (id, d) => apiFetch(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteContract: (id) => apiFetch(`/contracts/${id}`, { method: 'DELETE' }),
  snoozeContract: (id, days) => apiFetch(`/contracts/${id}/snooze`, { method: 'POST', body: JSON.stringify({ days }) }),
};
