import {
  checkAuth,
  handleGetContracts,
  handleCreateContract,
  handleUpdateContract,
  handleDeleteContract,
  handleSnoozeContract,
} from './routes/contracts';
import { runCron } from './cron';
import { getDb } from './db';
import type { Env } from './types';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const { pathname, searchParams } = new URL(request.url);
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    // ヘルスチェック
    if (pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // メールのスヌーズリンク（GETで直アクセス可能）
    // GET /snooze?id=xxx&days=30&secret=WORKER_SECRET
    if (pathname === '/snooze' && method === 'GET') {
      const id = searchParams.get('id');
      const days = parseInt(searchParams.get('days') ?? '30', 10);
      const secret = searchParams.get('secret');

      if (!id || secret !== env.WORKER_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }

      const snoozeDate = new Date();
      snoozeDate.setDate(snoozeDate.getDate() + days);
      const db = getDb(env);
      await db
        .from('contracts')
        .update({
          snoozed_until: snoozeDate.toISOString().split('T')[0],
          notified_at: null,
        })
        .eq('id', id);

      return new Response(
        `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,sans-serif;text-align:center;padding:60px 20px">
  <h2>✅ ${days}日後に再通知します</h2>
  <p style="margin-top:16px"><a href="${env.APP_BASE_URL}" style="color:#4f46e5">一覧に戻る</a></p>
</body></html>`,
        { headers: { 'Content-Type': 'text/html;charset=utf-8' } }
      );
    }

    // 契約CRUD
    if (pathname === '/contracts') {
      if (method === 'GET') return handleGetContracts(request, env, CORS);
      if (method === 'POST') return handleCreateContract(request, env, CORS);
    }

    const idMatch = pathname.match(/^\/contracts\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      if (method === 'PUT') return handleUpdateContract(id, request, env, CORS);
      if (method === 'DELETE') return handleDeleteContract(id, request, env, CORS);
    }

    const snoozeMatch = pathname.match(/^\/contracts\/([^/]+)\/snooze$/);
    if (snoozeMatch && method === 'POST') {
      return handleSnoozeContract(snoozeMatch[1], request, env, CORS);
    }

    return new Response('Not Found', { status: 404, headers: CORS });
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runCron(env).then(({ notified, errors }) => {
        console.log(`Cron complete: notified=${notified}, errors=${errors.length}`);
      })
    );
  },
};
