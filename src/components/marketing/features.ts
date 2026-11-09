import { Star, MessageSquareText, Users, ShieldCheck, UserCog, BarChart3 } from "lucide-react";
import type { TKey } from "@/lib/i18n";

export const FEATURES: { id: string; icon: typeof Star; t: TKey; d: TKey; long: TKey; bullets: TKey[] }[] = [
  { id: "sterrenfilter", icon: Star, t: "m_stars_t", d: "m_stars_d", long: "fd1_long", bullets: ["fd1_b1", "fd1_b2", "fd1_b3"] },
  { id: "sms", icon: MessageSquareText, t: "m_sms_t", d: "m_sms_d", long: "fd2_long", bullets: ["fd2_b1", "fd2_b2", "fd2_b3"] },
  { id: "klanten", icon: Users, t: "m_cust_t", d: "m_cust_d", long: "fd3_long", bullets: ["fd3_b1", "fd3_b2", "fd3_b3"] },
  { id: "feedback", icon: ShieldCheck, t: "m_shield_t", d: "m_shield_d", long: "fd4_long", bullets: ["fd4_b1", "fd4_b2", "fd4_b3"] },
  { id: "team", icon: UserCog, t: "m_team_t", d: "m_team_d", long: "fd5_long", bullets: ["fd5_b1", "fd5_b2", "fd5_b3"] },
  { id: "inzichten", icon: BarChart3, t: "m_stats_t", d: "m_stats_d", long: "fd6_long", bullets: ["fd6_b1", "fd6_b2", "fd6_b3"] },
];
