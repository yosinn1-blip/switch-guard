import { getSecret, setSecret } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('secret-input').value = getSecret();
  document.getElementById('save-btn').addEventListener('click', () => {
    const secret = document.getElementById('secret-input').value.trim();
    const status = document.getElementById('status');
    if (!secret) { status.textContent = '入力してください'; status.className = 'error'; return; }
    setSecret(secret);
    status.textContent = '✅ 保存しました';
    status.className = 'success';
    setTimeout(() => { window.location.href = 'index.html'; }, 800);
  });
});
