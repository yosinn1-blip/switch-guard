const SERVICE_LABELS: Record<string, string> = {
  electricity: '電気',
  gas: 'ガス',
  internet: 'ネット',
  insurance: '保険',
  other: 'その他',
};

const COMPARE_LINKS: Record<string, Array<{ label: string; url: string }>> = {
  electricity: [
    { label: 'エネチェンジで比較', url: 'https://enechange.jp/try/input' },
    { label: '価格.comで比較', url: 'https://kakaku.com/electricity-gas/' },
  ],
  gas: [
    { label: 'エネチェンジで比較', url: 'https://enechange.jp/try/input' },
    { label: '価格.comで比較', url: 'https://kakaku.com/electricity-gas/' },
  ],
  internet: [{ label: '価格.comで比較', url: 'https://kakaku.com/bb/' }],
  insurance: [{ label: '価格.comで比較', url: 'https://hoken.kakaku.com/' }],
  other: [],
};

export interface EmailPayload {
  subject: string;
  html: string;
}

export interface BuildEmailParams {
  contractId: string;
  serviceType: string;
  providerName: string;
  contractStart: string; // YYYY-MM-DD
  monthlyAmount?: number | null;
  appBaseUrl: string;
  workerSecret: string;
  workerUrl: string;
}

export function buildEmailContent(params: BuildEmailParams): EmailPayload {
  const label = SERVICE_LABELS[params.serviceType] ?? params.serviceType;
  const links = COMPARE_LINKS[params.serviceType] ?? [];
  const [year, month] = params.contractStart.split('-');

  const monthlyRow = params.monthlyAmount
    ? `<tr><td style="padding:4px 16px 4px 0;color:#888">月額概算</td><td>約${params.monthlyAmount.toLocaleString('ja-JP')}円</td></tr>`
    : '';

  const compareButtons = links
    .map(
      (l) =>
        `<a href="${l.url}" style="display:inline-block;margin:4px 8px 4px 0;padding:8px 16px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;font-size:14px;">${l.label} →</a>`
    )
    .join('');

  const snoozeUrl = `${params.workerUrl}/snooze?id=${params.contractId}&days=30&secret=${params.workerSecret}`;

  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <h1 style="font-size:22px;margin:0 0 8px">🔓 縛り解除のお知らせ</h1>
    <p style="font-size:16px;color:#333;margin:0 0 20px">
      <strong>[${label}] ${params.providerName}</strong> の縛りが切れました！<br>
      <span style="color:#16a34a;">✅ 今すぐ乗り換えても違約金なし</span>
    </p>

    <h2 style="font-size:15px;color:#555;margin:0 0 10px">📊 比較してみましょう</h2>
    <div style="margin-bottom:24px">
      ${compareButtons || '<p style="color:#888;font-size:14px">サービスのサイトで比較してください</p>'}
    </div>

    <h2 style="font-size:15px;color:#555;margin:0 0 10px">📋 登録中の情報</h2>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:24px">
      <tr><td style="padding:4px 16px 4px 0;color:#888">契約開始</td><td>${year}年${month}月〜</td></tr>
      ${monthlyRow}
    </table>

    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:13px;color:#888;margin:0">
      後で考える場合：<a href="${snoozeUrl}" style="color:#4f46e5">30日スヌーズ</a>
      &nbsp;|&nbsp;
      <a href="${params.appBaseUrl}" style="color:#4f46e5">一覧を見る</a>
    </p>
  </div>
</body>
</html>`;

  return {
    subject: `🔓 [${label}] ${params.providerName} の縛りが切れました`,
    html,
  };
}

export async function sendEmail(
  payload: EmailPayload,
  toEmail: string,
  resendApiKey: string
): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Switch Guard <onboarding@resend.dev>',
      to: toEmail,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend API error: ${response.status} ${text}`);
  }
}
