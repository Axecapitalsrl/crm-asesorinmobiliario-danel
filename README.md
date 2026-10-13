# CRM Asesor Inmobiliario — Danel

CRM privado para gestionar leads, pipeline, tareas, propiedades y métricas de productividad inmobiliaria.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL + Row Level Security
- Deploy pensado para Vercel

## Estado

Base inicial del proyecto. Antes de usarlo en producción, configura el proyecto Supabase, aplica `supabase/migrations/0001_initial_schema.sql`, añade las variables de entorno y autoriza únicamente el usuario administrador previsto.

## Configuración local

1. Instala Node.js LTS.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env.local` y completa las claves de Supabase.
4. Ejecuta `npm run dev`.

Consulta `docs/SETUP.md` para la configuración paso a paso.

## Seguridad

Nunca subas `.env.local`, claves secretas de Supabase ni contraseñas al repositorio. Las tablas de la aplicación usan RLS y las políticas limitan el acceso al usuario autenticado autorizado. Deshabilita el registro público en Supabase Auth para el despliegue privado.