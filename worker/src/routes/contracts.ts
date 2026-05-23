import { getDb } from '../db';
import { daysUntilUnlock } from '../unlock';
import type { Contract, ContractWithMeta, Env, ServiceType } from '../types';

export type CorsHeaders = Record<string, string>;

export function checkAuth(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  return auth.slice(7).trim() === env.WORKER_SECRET;
}

function json(data: unknown, status = 200, cors: CorsHeaders): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

const VALID_SERVICE_TYPES: ServiceType[] = [
  'electricity', 'gas', 'internet', 'insurance', 'other',
];

// GET /contracts
export async function handleGetContracts(
  request: Request, env: Env, cors: CorsHeaders
): Promise<Response> {
  if (!checkAuth(request, env)) return json({ error: 'Unauthorized' }, 401, cors);

  const db = getDb(env);
  const { data, error } = await db
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return json({ error: error.message }, 500, cors);

  const today = new Date();
  const enriched: ContractWithMeta[] = (data ?? []).map((c: Contract) => ({
    ...c,
    days_until_unlock: daysUntilUnlock(c.contract_start, c.lock_in_months, today),
  }));

  return json(enriched, 200, cors);
}

// POST /contracts
export async function handleCreateContract(
  request: Request, env: Env, cors: CorsHeaders
): Promise<Response> {
  if (!checkAuth(request, env)) return json({ error: 'Unauthorized' }, 401, cors);

  let body: Partial<Contract>;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, cors); }

  if (!body.service_type || !VALID_SERVICE_TYPES.includes(body.service_type)) {
    return json({ error: `service_type must be one of: ${VALID_SERVICE_TYPES.join(', ')}` }, 400, cors);
  }
  if (!body.provider_name?.trim()) {
    return json({ error: 'provider_name is required' }, 400, cors);
  }
  if (!body.contract_start || !/^\d{4}-\d{2}-\d{2}$/.test(body.contract_start)) {
    return json({ error: 'contract_start must be YYYY-MM-DD' }, 400, cors);
  }

  const db = getDb(env);
  const { data, error } = await db
    .from('contracts')
    .insert({
      service_type: body.service_type,
      provider_name: body.provider_name.trim(),
      contract_start: body.contract_start,
      lock_in_months: body.lock_in_months ?? 0,
      monthly_amount: body.monthly_amount ?? null,
      contract_number: body.contract_number ?? null,
      memo: body.memo ?? null,
    })
    .select()
    .single();

  if (error) return json({ error: error.message }, 500, cors);
  return json(data, 201, cors);
}

// PUT /contracts/:id
export async function handleUpdateContract(
  id: string, request: Request, env: Env, cors: CorsHeaders
): Promise<Response> {
  if (!checkAuth(request, env)) return json({ error: 'Unauthorized' }, 401, cors);

  let body: Partial<Contract>;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, cors); }

  // 変更不可フィールドを除去
  const { id: _id, created_at: _ca, unlock_date: _ud, ...updateData } = body as Record<string, unknown>;

  const db = getDb(env);
  const { data, error } = await db
    .from('contracts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return json({ error: error.message }, 500, cors);
  if (!data) return json({ error: 'Not found' }, 404, cors);
  return json(data, 200, cors);
}

// DELETE /contracts/:id
export async function handleDeleteContract(
  id: string, request: Request, env: Env, cors: CorsHeaders
): Promise<Response> {
  if (!checkAuth(request, env)) return json({ error: 'Unauthorized' }, 401, cors);

  const db = getDb(env);
  const { error } = await db.from('contracts').delete().eq('id', id);

  if (error) return json({ error: error.message }, 500, cors);
  return json({ success: true }, 200, cors);
}

// POST /contracts/:id/snooze
export async function handleSnoozeContract(
  id: string, request: Request, env: Env, cors: CorsHeaders
): Promise<Response> {
  if (!checkAuth(request, env)) return json({ error: 'Unauthorized' }, 401, cors);

  let body: { days?: number } = {};
  try { body = await request.json(); } catch { /* default */ }

  const days = typeof body.days === 'number' && body.days > 0 ? body.days : 30;
  const snoozeDate = new Date();
  snoozeDate.setDate(snoozeDate.getDate() + days);

  const db = getDb(env);
  const { data, error } = await db
    .from('contracts')
    .update({
      snoozed_until: snoozeDate.toISOString().split('T')[0],
      notified_at: null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return json({ error: error.message }, 500, cors);
  if (!data) return json({ error: 'Not found' }, 404, cors);
  return json(data, 200, cors);
}
