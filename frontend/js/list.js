import { api, getSecret } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!getSecret()) { window.location.href = 'settings.html'; return; }

  const listEl = document.getElementById('contract-list');
  const EMOJI = { electricity: '⚡', gas: '🔥', internet: '🌐', insurance: '🛡️', other: '📦' };

  function renderContract(c) {
    const emoji = EMOJI[c.service_type] || '📦';
    const monthly = c.monthly_amount ? `月額 約${c.monthly_amount.toLocaleString('ja-JP')}円` : '';
    const unlocked = c.days_until_unlock <= 0;

    const daysSection = unlocked
      ? `<div class="unlock-badge">🔓 縛り解除済み！乗り換えOK</div>`
      : `<div class="days-left">あと約 <strong>${c.days_until_unlock}</strong> 日</div>
         <div class="bar"><div class="fill" style="width:${Math.min(100, (730 - c.days_until_unlock) / 730 * 100)}%"></div></div>`;

    const actions = unlocked ? `
      <div class="actions">
        <a href="https://enechange.jp/try/input" target="_blank" class="btn-compare">比較する →</a>
        <button class="btn-snooze" data-id="${c.id}">30日スヌーズ</button>
      </div>` : '';

    return `<div class="card">
      <div class="card-top">
        <span class="name">${emoji} ${c.provider_name}</span>
        <button class="btn-del" data-id="${c.id}">✕</button>
      </div>
      <div class="meta">${monthly}</div>
      ${daysSection}${actions}
    </div>`;
  }

  async function load() {
    listEl.innerHTML = '<p class="msg">読み込み中...</p>';
    try {
      const contracts = await api.getContracts();
      if (!contracts.length) {
        listEl.innerHTML = '<p class="msg">登録済みの契約がありません。<a href="add.html">追加する →</a></p>';
        return;
      }
      listEl.innerHTML = contracts.map(renderContract).join('');

      listEl.querySelectorAll('.btn-del').forEach(btn =>
        btn.addEventListener('click', async () => {
          if (!confirm('削除しますか？')) return;
          await api.deleteContract(btn.dataset.id);
          load();
        })
      );
      listEl.querySelectorAll('.btn-snooze').forEach(btn =>
        btn.addEventListener('click', async () => {
          await api.snoozeContract(btn.dataset.id, 30);
          alert('30日後に再通知します');
          load();
        })
      );
    } catch (err) {
      listEl.innerHTML = `<p class="msg error">エラー: ${err.message}</p>`;
    }
  }

  load();
});
