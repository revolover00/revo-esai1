-- جدول استخدام المستخدم
CREATE TABLE public.user_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  free_uses_count INTEGER NOT NULL DEFAULT 0,
  subscription_expires_at TIMESTAMPTZ,
  active_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.user_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Redemption codes table
CREATE TABLE public.redemption_codes (
  code TEXT PRIMARY KEY,
  duration_days INTEGER NOT NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  is_developer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;
-- No client policies — only via redeem_code function

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON public.user_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create usage row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_usage (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_usage();

-- Consume one AI usage attempt
CREATE OR REPLACE FUNCTION public.consume_ai_usage(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.user_usage;
  free_limit CONSTANT INTEGER := 4;
BEGIN
  INSERT INTO public.user_usage (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO rec FROM public.user_usage WHERE user_id = _user_id FOR UPDATE;

  IF rec.subscription_expires_at IS NOT NULL AND rec.subscription_expires_at > now() THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'subscription',
      'free_remaining', GREATEST(0, free_limit - rec.free_uses_count),
      'subscription_expires_at', rec.subscription_expires_at
    );
  END IF;

  IF rec.free_uses_count < free_limit THEN
    UPDATE public.user_usage
      SET free_uses_count = free_uses_count + 1
      WHERE user_id = _user_id;
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'free',
      'free_remaining', free_limit - (rec.free_uses_count + 1),
      'subscription_expires_at', NULL
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', false,
    'reason', 'no_quota',
    'free_remaining', 0,
    'subscription_expires_at', rec.subscription_expires_at
  );
END;
$$;

-- Redeem code function
CREATE OR REPLACE FUNCTION public.redeem_code(_user_id UUID, _code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_rec public.redemption_codes;
  current_expiry TIMESTAMPTZ;
  new_expiry TIMESTAMPTZ;
  normalized TEXT;
BEGIN
  IF _code IS NULL OR length(trim(_code)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_code');
  END IF;

  normalized := upper(trim(_code));

  SELECT * INTO code_rec FROM public.redemption_codes WHERE code = normalized FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  IF code_rec.used_by IS NOT NULL AND NOT code_rec.is_developer THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_used');
  END IF;

  INSERT INTO public.user_usage (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT subscription_expires_at INTO current_expiry FROM public.user_usage WHERE user_id = _user_id FOR UPDATE;

  IF code_rec.is_developer THEN
    new_expiry := now() + (code_rec.duration_days || ' days')::interval;
  ELSIF current_expiry IS NOT NULL AND current_expiry > now() THEN
    new_expiry := current_expiry + (code_rec.duration_days || ' days')::interval;
  ELSE
    new_expiry := now() + (code_rec.duration_days || ' days')::interval;
  END IF;

  UPDATE public.user_usage
    SET subscription_expires_at = new_expiry,
        active_code = normalized
    WHERE user_id = _user_id;

  IF NOT code_rec.is_developer THEN
    UPDATE public.redemption_codes
      SET used_by = _user_id, used_at = now()
      WHERE code = normalized;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'duration_days', code_rec.duration_days,
    'subscription_expires_at', new_expiry,
    'is_developer', code_rec.is_developer
  );
END;
$$;

-- Insert all 80 user codes + 3 developer codes
INSERT INTO public.redemption_codes (code, duration_days, is_developer) VALUES
('TXA3UEFTH', 7, false),('VK2LM6JAY', 7, false),('NVY8VL4FH', 7, false),('8EUWP6BDH', 7, false),('GCZXM9NNK', 7, false),
('WTU2VB9PE', 7, false),('WHAKDGJTX', 7, false),('TQGEZ3DLB', 7, false),('YSBN7DRDL', 7, false),('PQCVBEA3Y', 7, false),
('ZP7NHLPTV', 7, false),('B273B2QTC', 7, false),('XL9THNKA8', 7, false),('2CX5ULPUF', 7, false),('Y3V6M88KT', 7, false),
('J3CMEMVN5', 7, false),('GZZQ77BME', 7, false),('ZMLSCW676', 7, false),('YW2KV44X5', 7, false),('CWA5CUA8P', 7, false),
('QQXNPZEU6', 14, false),('ZZEJJHU6J', 14, false),('9MYYZ5JTV', 14, false),('EB6C9QXYY', 14, false),('MQ5DAVLPA', 14, false),
('UAGYJAWKQ', 14, false),('GUU9LY642', 14, false),('PZNXD5JWZ', 14, false),('7NVHJUYHD', 14, false),('FTVHVEPCV', 14, false),
('4XQHZ2LRU', 14, false),('59NL9NLK2', 14, false),('49LY95GSQ', 14, false),('CAYAQVY4S', 14, false),('ZXDHRLCQN', 14, false),
('QGXX2KHM8', 14, false),('T6PLHHZC2', 14, false),('JM92H9YFP', 14, false),('N93FUTWN5', 14, false),('ZMBWJQ7PQ', 14, false),
('AXMM7L3W9', 21, false),('2RSTC6YBT', 21, false),('B2PPMJ7KM', 21, false),('72RC9PF3Z', 21, false),('HA9ZS88WZ', 21, false),
('WB3XDATLR', 21, false),('4ZECHBJ5W', 21, false),('3SQJE59CC', 21, false),('7F7UXV5UY', 21, false),('YWSHV9P4A', 21, false),
('94VQ7CB5F', 21, false),('G7WRFFPJP', 21, false),('R38G8DKR8', 21, false),('BH76M5JMP', 21, false),('744Y2MSB6', 21, false),
('FM8UQCTHP', 21, false),('RF7ZESDH4', 21, false),('CPW6XP7VW', 21, false),('73J2JLKCN', 21, false),('65AQRGBAR', 21, false),
('CNYYSAAUH', 30, false),('CQQN3PVA7', 30, false),('J3YR2G4JQ', 30, false),('459NPDSHS', 30, false),('2TM9RKLNA', 30, false),
('ZE3B9M8J4', 30, false),('GJ8MX4EKH', 30, false),('V67CLFUKM', 30, false),('WULYR593A', 30, false),('TXPCU9EC4', 30, false),
('BBME9XEWF', 30, false),('T7F2J3MZW', 30, false),('LUT3H5PRZ', 30, false),('XDZ9WHJ3J', 30, false),('A9W7RCXXW', 30, false),
('SX8757MXZ', 30, false),('X3QUZK7CG', 30, false),('VBKC29UD4', 30, false),('KJZ42BYSR', 30, false),('GNVADDM57', 30, false),
('ABDOELMSSIRY2026CREATOR', 36500, true),
('OMARMOHARAM2026PF', 36500, true),
('OMARKARAM2026PF', 36500, true);