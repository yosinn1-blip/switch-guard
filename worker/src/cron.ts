import { getDb } from './db';
import { buildEmailContent, sendEmail } from './notify';
import type { Contract, Env } from './types';

export async function runCron(env: Env): Promise<{ notified: number; errors: string[] }> {
  const db = getDb(env);
  const today = new Date().toISOString().split('T')[0];

  const { data: contracts, error } = await db
    .from('contracts')
    .select('*')
    .lte('unlock_date', today)
    .is('notified_at', null)
    .or(`snoozed_until.is.null,snoozed_until.lt.${today}`);

  if (error) {
    console.error('Cron: Supabase query error', error.message);
    return { notified: 0, errors: [error.message] };
  }

  const errors: string[] = [];
  let notified = 0;

  for (const contract of (contracts ?? []) as Contract[]) {
    try {
      const emailPayload = buildEmailContent({
        contractId: contract.id,
        serviceType: contract.service_type,
        providerName: contract.provider_name,
        contractStart: contract.contract_start,
        monthlyAmount: contract.monthly_amount,
        appBaseUrl: env.APP_BASE_URL,
        workerSecret: env.WORKER_SECRET,
        workerUrl: env.WORKER_URL ?? '',
      });

      await sendEmail(emailPayload, env.NOTIFY_EMAIL, env.RESEND_API_KEY);

      await db
        .from('contracts')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', contract.id);

      notified++;
      console.log(`Cron: notified ${contract.id} (${contract.provider_name})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Cron: failed for ${contract.id}:`, msg);
      errors.push(`${contract.id}: ${msg}`);
    }
  }

  return { notified, errors };
}
