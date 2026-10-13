import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/dashboard";
export default async function DashboardPage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user) redirect("/login");
 const {data:profile}=await sb.from("profiles").select("full_name,role,is_active").eq("id",user.id).maybeSingle();
 if(!profile||profile.role!=="owner"||!profile.is_active) redirect("/login?error=unauthorized");
 const [l,s,t,p,g,a]=await Promise.all([
  sb.from("leads").select("id,name,status,stage_id,created_at,source,lead_type,estimated_value,next_follow_up_at").order("created_at",{ascending:false}).limit(500),
  sb.from("pipeline_stages").select("id,name,color,position,is_won,is_lost,is_active").eq("is_active",true).order("position"),
  sb.from("tasks").select("id,title,due_at,status,priority,lead_id").neq("status","completed").order("due_at").limit(100),
  sb.from("properties").select("id,title,status,listing_price,currency").order("created_at",{ascending:false}).limit(100),
  sb.from("goals").select("id,metric_key,period,target_value,starts_on,ends_on").order("starts_on",{ascending:false}).limit(100),
  sb.from("activities").select("id,activity_type,subject,occurred_at,lead_id").order("occurred_at",{ascending:false}).limit(100)
 ]);
 const hasErrors=[l.error,s.error,t.error,p.error,g.error,a.error].some(Boolean);
 return <Dashboard profile={{name:profile.full_name||user.email||"Agente",email:user.email||""}} initialData={{leads:l.data??[],stages:s.data??[],tasks:t.data??[],properties:p.data??[],goals:g.data??[],activities:a.data??[],dataError:hasErrors?"Error de datos: verificá la migración SQL y las políticas RLS.":null}}/>;
}