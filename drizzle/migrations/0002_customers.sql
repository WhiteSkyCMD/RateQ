CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  notes text,
  last_requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, phone)
);
CREATE INDEX customers_business_idx ON public.customers(business_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read customers" ON public.customers FOR SELECT TO authenticated
  USING (public.member_role(business_id, auth.uid()) IS NOT NULL OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "members insert customers" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.member_role(business_id, auth.uid()) IS NOT NULL);
CREATE POLICY "members update customers" ON public.customers FOR UPDATE TO authenticated
  USING (public.member_role(business_id, auth.uid()) IS NOT NULL);
CREATE POLICY "members delete customers" ON public.customers FOR DELETE TO authenticated
  USING (public.member_role(business_id, auth.uid()) IS NOT NULL);