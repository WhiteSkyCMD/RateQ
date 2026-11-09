CREATE OR REPLACE FUNCTION public.consume_sms_credit(_business_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n int;
BEGIN
  UPDATE public.businesses SET sms_credits = sms_credits - 1 WHERE id = _business_id AND sms_credits > 0;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n > 0;
END $$;
CREATE OR REPLACE FUNCTION public.refund_sms_credit(_business_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.businesses SET sms_credits = sms_credits + 1 WHERE id = _business_id;
$$;
REVOKE ALL ON FUNCTION public.consume_sms_credit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_sms_credit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_sms_credit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_sms_credit(uuid) TO service_role;