import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const workspaceQuery = queryOptions({
  queryKey: ["workspace"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("no user");
    const [{ data: roles }, { data: member }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      supabase.from("business_members").select("role, businesses(*)").eq("user_id", u.user.id).limit(1).maybeSingle(),
      supabase.from("profiles").select("full_name, email").eq("id", u.user.id).maybeSingle(),
    ]);
    return {
      user: u.user,
      profile,
      isSuperAdmin: !!roles?.some((r) => r.role === "super_admin"),
      role: member?.role ?? null,
      business: member?.businesses ?? null,
    };
  },
});

export function useWorkspace() {
  return useQuery(workspaceQuery);
}

export const requestsQuery = (businessId: string) =>
  queryOptions({
    queryKey: ["requests", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
