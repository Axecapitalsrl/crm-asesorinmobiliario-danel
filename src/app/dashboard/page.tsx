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
    redirect("/login?error=unauthorized");
  }

  const [leadsR, stagesR, tasksR, propertiesR, goalsR, activitiesR, fieldsR] = await Promise.all([
    supabase.from("leads").select("id,name,status,stage_id,created_at,source,lead_type,estimated_value,next_follow_up_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("pipeline_stages").select("id,name,color,position,is_won,is_lost,is_active").eq("is_active", true).order("position"),
    supabase.from("tasks").select("id,title,due_at,status,priority,lead_id").neq("status", "completed").order("due_at").limit(100),
    supabase.from("properties").select("id,title,status,listing_price,currency").order("created_at", { ascending: false }).limit(100),
    supabase.from("goals").select("id,metric_key,period,target_value,starts_on,ends_on").order("starts_on", { ascending: false }).limit(100),
    supabase.from("activities").select("id,activity_type,subject,occurred_at,lead_id").order("occurred_at", { ascending: false }).limit(100),
    supabase.from("custom_fields").select("id,name,field_key,entity_type,field_type,is_required,is_active").eq("is_active", true).order("position")
  ]);

  const hasErrors = [leadsR.error, stagesR.error, tasksR.error, propertiesR.error, goalsR.error, activitiesR.error].some(Boolean);
  return (
    <Dashboard
      profile={{ name: profile.full_name || user.email || "Agente", email: user.email || "" }}
      initialData={{
        leads: leadsR.data ?? [],
        stages: stagesR.data ?? [],
        tasks: tasksR.data ?? [],
        properties: propertiesR.data ?? [],
        goals: goalsR.data ?? [],
        activities: activitiesR.data ?? [],
        customFields: fieldsR.data ?? [],
        dataError: hasErrors ? "No se pudieron cargar algunos datos. Verificá la migración SQL y las políticas RLS." : null
      }}
    />
  );
}