"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
export default function LoginPage() {
  const router=useRouter();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [show,setShow]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const sb=createClient();
      const {error:loginError}=await sb.auth.signInWithPassword({email:email.trim(),password});
      if(loginError) throw loginError;
      const {data:{user}}=await sb.auth.getUser();
      if(!user) throw new Error("No pudimos validar tu sesión.");
      const {data:profile,error:profileError}=await sb.from("profiles").select("role,is_active").eq("id",user.id).maybeSingle();
      if(profileError||!profile||profile.role!=="owner"||!profile.is_active) {
        await sb.auth.signOut();
        throw new Error("Este usuario no está autorizado para acceder al CRM.");
      }
      router.replace("/dashboard"); router.refresh();
    } catch(err) { setError(err instanceof Error?err.message:"No se pudo iniciar sesión."); }
    finally { setLoading(false); }
  }
  return <main className="grid min-h-screen bg-white lg:grid-cols-2">
    <section className="hidden flex-col justify-between bg-gradient-to-br from-[#101c36] to-[#203b71] p-14 text-white lg:flex">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-white/10 p-3"><Building2 size={25}/></div><div><p className="font-semibold tracking-wide">CRM INMOBILIARIO</p><p className="text-sm text-white/60">Danel · Gestión personal</p></div></div>
      <div className="max-w-xl"><p className="mb-4 text-sm uppercase tracking-[.2em] text-blue-200">Tu negocio, bajo control</p><h1 className="text-5xl font-semibold leading-tight">Cada contacto cuenta.<br/>Cada resultado se mide.</h1><p className="mt-6 max-w-md text-lg leading-8 text-white/70">Clientes, oportunidades, propiedades y seguimiento en un solo lugar.</p></div>
      <p className="text-xs text-white/40">Acceso privado · Información protegida</p>
    </section>
    <section className="flex items-center justify-center px-6 py-12"><div className="w-full max-w-md">
      <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="rounded-xl bg-[#172744] p-3 text-white"><Building2/></div><div><p className="font-semibold">CRM INMOBILIARIO</p><p className="text-sm text-slate-500">Acceso privado</p></div></div>
      <div className="mb-8"><div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-700"><LockKeyhole size={23}/></div><h2 className="text-3xl font-semibold tracking-tight text-slate-900">Bienvenido de nuevo</h2><p className="mt-2 text-slate-500">Ingresá con tu usuario autorizado para continuar.</p></div>
      <form onSubmit={submit} className="space-y-5">
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Correo electrónico</span><input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="tu@correo.com"/></label>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Contraseña</span><span className="relative block"><input type={show?"text":"password"} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="Tu contraseña"/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Ocultar contraseña":"Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400">{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></span></label>
        {error&&<p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{loading?"Validando acceso…":"Ingresar al CRM"}</button>
      </form><p className="mt-8 text-center text-xs leading-5 text-slate-400">Sistema privado. El registro público no está disponible.</p>
    </div></section>
  </main>;
}