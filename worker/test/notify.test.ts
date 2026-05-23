import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildEmailContent, sendEmail } from '../src/notify';

describe('buildEmailContent', () => {
  it('電気サービスのメール内容を生成する', () => {
    const result = buildEmailContent({
      contractId: 'test-id-123',
      serviceType: 'electricity',
      providerName: '東京電力',
      contractStart: '2022-05-01',
      monthlyAmount: 8000,
      appBaseUrl: 'https://example.github.io/switch-guard',
      workerSecret: 'my-secret',
      workerUrl: 'https://switch-guard.workers.dev',
    });

    expect(result.subject).toBe('🔓 [電気] 東京電力 の縛りが切れました');
    expect(result.html).toContain('東京電力');
    expect(result.html).toContain('8,000');
    expect(result.html).toContain('2022年05月');
    expect(result.html).toContain('enechange.jp');
    expect(result.html).toContain('test-id-123');
  });

  it('月額未設定の場合は月額行を省略する', () => {
    const result = buildEmailContent({
      contractId: 'abc',
      serviceType: 'internet',
      providerName: 'ソフトバンク光',
      contractStart: '2024-01-15',
      appBaseUrl: 'https://example.github.io/switch-guard',
      workerSecret: 'secret',
      workerUrl: 'https://switch-guard.workers.dev',
    });

    expect(result.subject).toContain('ネット');
    expect(result.html).not.toContain('月額概算');
  });

  it('不明なサービス種別はotherとして処理する', () => {
    const result = buildEmailContent({
      contractId: 'abc',
      serviceType: 'other',
      providerName: 'テスト会社',
      contractStart: '2023-06-01',
      appBaseUrl: 'https://example.github.io/switch-guard',
      workerSecret: 'secret',
      workerUrl: 'https://switch-guard.workers.dev',
    });
    expect(result.subject).toContain('その他');
  });
});

describe('sendEmail', () => {
  afterEach(() => vi.restoreAllMocks());

  it('Resend APIに正しくPOSTする', async () => {
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'email-id-123' }), { status: 200 })
    );

    await sendEmail({ subject: 'テスト件名', html: '<p>テスト</p>' }, 'test@gmail.com', 'resend-key-xxx');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init as RequestInit).method).toBe('POST');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.to).toBe('test@gmail.com');
    expect(body.subject).toBe('テスト件名');
  });

  it('APIエラー時はthrowする', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('{"message":"Invalid API key"}', { status: 403 })
    );
    await expect(
      sendEmail({ subject: 'test', html: '' }, 'a@b.com', 'bad-key')
    ).rejects.toThrow('Resend API error: 403');
  });
});
