import { api, getSecret } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  if (!getSecret()) { window.location.href = 'settings.html'; return; }

  const lockInSelect = document.getElementById('lock-in-select');
  const lockInCustom = document.getElementById('lock-in-custom');
  lockInSelect.addEventListener('change', () => {
    lockInCustom.style.display = lockInSelect.value === 'custom' ? 'block' : 'none';
  });

  document.getElementById('contract-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('status');
    status.textContent = '登録中...';
    status.className = '';

    let lockInMonths = parseInt(lockInSelect.value, 10);
    if (lockInSelect.value === 'custom') lockInMonths = parseInt(lockInCustom.value, 10) || 0;

    try {
      await api.createContract({
        service_type: document.getElementById('service-type').value,
        provider_name: document.getElementById('provider-name').value,
        contract_start: document.getElementById('contract-start').value,
        lock_in_months: lockInMonths,
        monthly_amount: parseInt(document.getElementById('monthly-amount').value, 10) || null,
        contract_number: document.getElementById('contract-number').value || null,
        memo: document.getElementById('memo').value || null,
      });
      status.textContent = '✅ 登録しました！';
      setTimeout(() => { window.location.href = 'index.html'; }, 800);
    } catch (err) {
      status.textContent = `❌ ${err.message}`;
      status.className = 'error';
    }
  });
});
