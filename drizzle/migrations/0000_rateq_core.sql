
CREATE TYPE public.app_role AS ENUM ('super_admin','owner','staff');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  sms_sender_name text,
  google_url text,
  trustpilot_url text,
  facebook_url text,
  google_enabled boolean NOT NULL DEFAULT true,
  trustpilot_enabled boolean NOT NULL DEFAULT false,
  facebook_enabled boolean NOT NULL DEFAULT false,
  sms_template text NOT NULL DEFAULT 'Hoi {naam}, bedankt voor je bezoek aan {bedrijf}! Wil je ons beoordelen? {link}',
  plan text NOT NULL DEFAULT 'demo',
  sms_credits integer NOT NULL DEFAULT 10,
  invite_code text NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);
GRANT SELECT, DELETE ON public.business_members TO authenticated;
GRANT ALL ON public.business_members TO service_role;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.member_role(_business_id uuid, _user_id uuid)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.business_members WHERE business_id = _business_id AND user_id = _user_id LIMIT 1
$$;

CREATE TABLE public.review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status text NOT NULL DEFAULT 'sent',
  rating integer,
  feedback text,
  platform text,
  resolved boolean NOT NULL DEFAULT false,
  twilio_sid text,
  error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  rated_at timestamptz
);
GRANT SELECT, UPDATE ON public.review_requests TO authenticated;
GRANT ALL ON public.review_requests TO service_role;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.review_requests (business_id, created_at DESC);

-- Policies
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'super_admin')
    OR EXISTS (SELECT 1 FROM public.business_members m1 JOIN public.business_members m2 ON m1.business_id = m2.business_id
               WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "members read business" ON public.businesses FOR SELECT TO authenticated
  USING (public.member_role(id, auth.uid()) IS NOT NULL OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "owner updates business" ON public.businesses FOR UPDATE TO authenticated
  USING (public.member_role(id, auth.uid()) = 'owner');

CREATE POLICY "members read members" ON public.business_members FOR SELECT TO authenticated
  USING (public.member_role(business_id, auth.uid()) IS NOT NULL OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "owner removes staff" ON public.business_members FOR DELETE TO authenticated
  USING (public.member_role(business_id, auth.uid()) = 'owner' AND role = 'staff');

CREATE POLICY "members read requests" ON public.review_requests FOR SELECT TO authenticated
  USING (public.member_role(business_id, auth.uid()) IS NOT NULL OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "owner updates requests" ON public.review_requests FOR UPDATE TO authenticated
  USING (public.member_role(business_id, auth.uid()) = 'owner');

-- Protect billing columns from client edits
CREATE OR REPLACE FUNCTION public.protect_business_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.plan := OLD.plan; NEW.sms_credits := OLD.sms_credits; NEW.owner_id := OLD.owner_id; NEW.invite_code := OLD.invite_code;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_business BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.protect_business_columns();

-- Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _biz uuid; _code text; _name text;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email);
  _code := NULLIF(trim(NEW.raw_user_meta_data->>'invite_code'), '');
  IF _code IS NOT NULL THEN
    SELECT id INTO _biz FROM public.businesses WHERE invite_code = lower(_code);
  END IF;
  IF _biz IS NOT NULL THEN
    INSERT INTO public.business_members (business_id, user_id, role) VALUES (_biz, NEW.id, 'staff');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff') ON CONFLICT DO NOTHING;
  ELSE
    _name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'business_name',''), 'Mijn bedrijf');
    INSERT INTO public.businesses (name, owner_id, sms_sender_name) VALUES (_name, NEW.id, left(regexp_replace(_name, '[^A-Za-z0-9 ]', '', 'g'), 11))
      RETURNING id INTO _biz;
    INSERT INTO public.business_members (business_id, user_id, role) VALUES (_biz, NEW.id, 'owner');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
