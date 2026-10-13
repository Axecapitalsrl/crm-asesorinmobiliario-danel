import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "owner" || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  const [
    leadsResult,
    stagesResult,
    tasksResult,
    propertiesResult,
    goalsResult,
    activityResult,
  ] = await Promise.all([
    supabase.from("leads").select("id, name, status, stage_id, created_at, source, lead_type, estimated_value, next_follow_up_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("pipeline_stages").select("id, name, color, position, is_won, is_lost, is_active").eq("is_active", true).order("position"),
    supabase.from("tasks").select("id, title, due_at, status, priority, lead_id").neq("status", "completed").order("due_at").limit(100),
    supabase.from("properties").select("id, title, status, listing_price, currency").order("created_at", { ascending: false }).limit(100),
    supabase.from("goals").select("id, metric_key, period, target_value, starts_on, ends_on").order("starts_on", { ascending: false }).limit(100),
    supabase.from("activities").select("id, activity_type, subject, occurred_at, lead_id").order("occurred_at", { ascending: false }).limit(8),
  ]);

  const errors = [leadsResult.error, stagesResult.error, tasksResult.error, propertiesResult.error, goalsResult.error, activityResult.error].filter(Boolean);
  const initialData = {
    leads: leadsResult.data ?? [],
    stages: stagesResult.data ?? [],
    tasks: tasksResult.data ?? [],
    properties: propertiesResult.data ?? [],
    goals: goalsResult.data ?? [],
    activities: activityResult.data ?? [],
    dataError: errors.length > 0 ? "No se pudo cargar una parte de los datos. Verificá que aplicaste la migración SQL." : null,
  };

  return <Dashboard profile={{ name: profile.full_name || user.email || "Agente", email: user.email || "" }} initialData={initialData} />;
}