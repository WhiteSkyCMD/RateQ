ALTER TABLE public.businesses ADD COLUMN cancel_at_period_end boolean NOT NULL DEFAULT false, ADD COLUMN cancelled_at timestamptz;

CREATE OR REPLACE FUNCTION public.protect_business_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.plan := OLD.plan; NEW.sms_credits := OLD.sms_credits; NEW.owner_id := OLD.owner_id; NEW.invite_code := OLD.invite_code;
    NEW.cancel_at_period_end := OLD.cancel_at_period_end; NEW.cancelled_at := OLD.cancelled_at;
  END IF;
  RETURN NEW;
END $$;

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  number text NOT NULL,
  description text NOT NULL,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  issued_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads invoices" ON public.invoices FOR SELECT TO authenticated
USING (public.member_role(business_id, auth.uid()) = 'owner'::app_role OR public.has_role(auth.uid(), 'super_admin'::app_role));