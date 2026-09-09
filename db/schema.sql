CREATE TABLE IF NOT EXISTS users(
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK(plan IN ('free','plus')),
  current_streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  subscription_status text,
  payment_provider text,
  subscription_cycle text,
  mercado_pago_subscription_id text UNIQUE,
  plus_until timestamptz,
  imported_guest_events jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users(lower(email));

CREATE TABLE IF NOT EXISTS sessions(
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS progress(
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'playing',
  guesses jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_attempts integer,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  last_retry_at timestamptz,
  PRIMARY KEY(user_id,case_id)
);

CREATE TABLE IF NOT EXISTS checkout_intents(
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  cycle text NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  matched_subscription_id text,
  matched_at timestamptz
);
CREATE INDEX IF NOT EXISTS checkout_intents_lookup_idx ON checkout_intents(user_id,plan_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS subscriptions(
  provider_subscription_id text PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  provider text NOT NULL,
  cycle text,
  status text,
  plan_id text,
  payer_email text,
  next_payment_date timestamptz,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_email_idx ON subscriptions(lower(payer_email));

CREATE TABLE IF NOT EXISTS payment_events(
  id bigserial PRIMARY KEY,
  provider text NOT NULL,
  event_type text NOT NULL,
  external_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider,event_type,external_id)
);

CREATE TABLE IF NOT EXISTS analytics_events(
  id bigserial PRIMARY KEY,
  event_name text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON analytics_events(created_at DESC);
