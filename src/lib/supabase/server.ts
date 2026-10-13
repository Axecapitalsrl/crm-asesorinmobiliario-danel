import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase.");
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values: Array<{ name: string; value: string; options?: Parameters<typeof store.set>[2] }>) {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Los Server Components no siempre pueden escribir cookies. */ }
      }
    }
  });
}