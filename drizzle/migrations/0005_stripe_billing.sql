ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS stripe_customer_id text, ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stripe_ref text UNIQUE;
CREATE OR REPLACE FUNCTION public.protect_business_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.plan := OLD.plan; NEW.sms_credits := OLD.sms_credits; NEW.owner_id := OLD.owner_id; NEW.invite_code := OLD.invite_code;
    NEW.cancel_at_period_end := OLD.cancel_at_period_end; NEW.cancelled_at := OLD.cancelled_at;
    NEW.stripe_customer_id := OLD.stripe_customer_id; NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.add_sms_credits(_business_id uuid, _qty integer)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.businesses SET sms_credits = sms_credits + _qty WHERE id = _business_id;
$$;
REVOKE EXECUTE ON FUNCTION public.add_sms_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_sms_credits(uuid, integer) TO service_role;