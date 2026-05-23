-- Switch Guard: contracts table
-- Run this in Supabase SQL Editor

CREATE TABLE contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type    TEXT NOT NULL CHECK (service_type IN ('electricity','gas','internet','insurance','other')),
  provider_name   TEXT NOT NULL,
  contract_start  DATE NOT NULL,
  lock_in_months  INTEGER NOT NULL DEFAULT 0 CHECK (lock_in_months >= 0),
  monthly_amount  INTEGER,
  contract_number TEXT,
  notified_at     TIMESTAMPTZ,
  snoozed_until   DATE,
  memo            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 縛り解除日（生成カラム: lock_in_months ヶ月後）
  unlock_date DATE GENERATED ALWAYS AS (
    (contract_start + make_interval(months => lock_in_months))::date
  ) STORED
);

CREATE INDEX idx_contracts_unlock_date ON contracts(unlock_date);
CREATE INDEX idx_contracts_cron ON contracts(unlock_date, notified_at, snoozed_until);

-- 個人ツールのためRLSは無効（フェーズ3でマルチユーザー化時に有効化）
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
