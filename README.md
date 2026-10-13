# CRM Asesor Inmobiliario — Danel

CRM privado para trabajar leads, clientes, pipeline, tareas, propiedades y métricas de productividad.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL + Row Level Security
- Despliegue preparado para Vercel

## Configuración rápida
1. Crea un proyecto Supabase independiente.
2. Ejecuta `supabase/migrations/0001_initial_schema.sql` en Supabase SQL Editor.
3. En Authentication → Users, crea/invita el usuario permitido y sigue `docs/SETUP.md` para asignarle el rol owner por SQL.
4. Copia `.env.example` a `.env.local` y completa la URL y clave publicable del proyecto Supabase.
5. Ejecuta `npm install` y `npm run dev`.

Nunca subas `.env.local`, contraseñas o claves secretas/service-role al repo. Mantén RLS habilitado y el registro público de usuarios desactivado.

## Estado
Primera base funcional en desarrollo. Debe conectarse a tu proyecto de Supabase y verificarse con una compilación y pruebas de acceso antes de cargar datos reales o usarla en producción.