import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();
const interests = new Set([
  "Quiero vivir con mi familia",
  "Me interesa como inversión",
  "Quiero recibir más información",
]);
const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

function response(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function limitFor(ip: string, now = Date.now()) {
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  let originHost = "";
  try { originHost = origin ? new URL(origin).host : ""; } catch { /* valor inválido */ }
  if (!originHost || originHost !== request.nextUrl.host) {
    return response({ error: "Solicitud no válida." }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) return response({ error: "Solicitud demasiado grande." }, 413);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid body");
    body = parsed as Record<string, unknown>;
  } catch {
    return response({ error: "No se pudieron leer los datos del formulario." }, 400);
  }

  // A filled honeypot is treated as accepted so automated bots stop retrying.
  if (cleanString(body.company_website, 200)) return response({ ok: true }, 201);

  const name = cleanString(body.name, 120);
  const phone = cleanString(body.phone, 30);
  const email = cleanString(body.email, 160);
  const interest = cleanString(body.interest, 80);
  const consent = body.consent === true;
  const phoneDigits = phone.replace(/\D/g, "");
  if (name.length < 2 || phoneDigits.length < 7 || phoneDigits.length > 15 || !interests.has(interest) || !consent) {
    return response({ error: "Revisá tu nombre, teléfono e interés e intentá de nuevo." }, 400);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response({ error: "El correo electrónico no parece válido." }, 400);
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  if (limitFor(ip)) return response({ error: "Recibimos varios intentos desde tu conexión. Esperá unos minutos y probá de nuevo." }, 429);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return response({ error: "La recepción de consultas del CRM todavía no está configurada." }, 503);
  }

  const campaign = body.campaign && typeof body.campaign === "object" && !Array.isArray(body.campaign)
    ? body.campaign as Record<string, unknown>
    : {};
  const campaignDetails = campaignKeys
    .map((key) => [key, cleanString(campaign[key], 100)] as const)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
  const notes = [
    "Consulta web por Condominio Elsita.",
    `Interés: ${interest}.`,
    campaignDetails ? `Campaña: ${campaignDetails}.` : "",
  ].filter(Boolean).join(" ").slice(0, 1000);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "elsita-landing" } },
  });
  const { error } = await supabase.from("leads").insert({
    name,
    phone,
    email: email || null,
    lead_type: interest === "Me interesa como inversión" ? "investor" : "buyer",
    source: "website",
    status: "active",
    notes,
  });

  if (error) return response({ error: "No pudimos guardar tu consulta. Probá de nuevo en un momento." }, 502);
  return response({ ok: true }, 201);
}
