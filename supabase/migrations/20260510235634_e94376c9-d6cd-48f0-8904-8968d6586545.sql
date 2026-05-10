
ALTER TABLE public.user_usage ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.redeem_code(_user_id uuid, _code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  code_rec public.redemption_codes;
  current_expiry TIMESTAMPTZ;
  new_expiry TIMESTAMPTZ;
  new_start TIMESTAMPTZ;
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
    new_start := now();
  ELSIF current_expiry IS NOT NULL AND current_expiry > now() THEN
    new_expiry := current_expiry + (code_rec.duration_days || ' days')::interval;
    new_start := COALESCE((SELECT subscription_started_at FROM public.user_usage WHERE user_id = _user_id), now());
  ELSE
    new_expiry := now() + (code_rec.duration_days || ' days')::interval;
    new_start := now();
  END IF;

  UPDATE public.user_usage
    SET subscription_expires_at = new_expiry,
        subscription_started_at = new_start,
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
    'subscription_started_at', new_start,
    'is_developer', code_rec.is_developer
  );
END;
$function$;
