# Configuración inicial

1. Crea un proyecto Supabase independiente para este CRM.
2. En SQL Editor ejecuta `supabase/migrations/0001_initial_schema.sql`.
3. En Authentication → Users crea/invita tu usuario autorizado. Copia su UUID desde el panel.
4. Ejecuta la sentencia comentada al final de la migración, reemplazando el UUID por el tuyo.
5. Deshabilita el registro público y configura Site URL y Redirect URLs en Supabase.
6. Copia `.env.example` a `.env.local` y completa la URL y clave publicable de Supabase.
7. Ejecuta `npm install` y `npm run dev`; abre http://localhost:3000.
8. Importa el repo a Vercel, configura las mismas variables y añade la URL productiva a Supabase Redirect URLs.

Nunca publiques `.env.local` ni una clave secreta/service-role. Mantén RLS activo. No cargues datos reales hasta probar las políticas y el acceso.

La base inicial incluye login, dashboard, alta/listado de leads, pipeline, tareas, propiedades, objetivos e historial básico. La edición avanzada de campos personalizados queda para una iteración posterior.