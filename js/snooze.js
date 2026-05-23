import { api, getSecret } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const days = parseInt(params.get('days'), 10) || 30;
  const status = document.getElementById('status');

  if (!id || !getSecret()) { status.textContent = 'パラメータが不正です'; return; }

  try {
    await api.snoozeContract(id, days);
    status.innerHTML = `✅ ${days}日後に再通知します。<br><a href="index.html">一覧に戻る</a>`;
  } catch (err) {
    status.textContent = `❌ ${err.message}`;
  }
});
