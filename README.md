# CRM Asesor Inmobiliario — Danel

CRM privado para gestionar leads, pipeline, tareas, propiedades y métricas inmobiliarias.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL + Row Level Security
- Vercel

## Preparación
1. Crea un proyecto Supabase independiente.
2. Ejecuta `supabase/migrations/0001_initial_schema.sql` en SQL Editor.
3. Crea el usuario autorizado en Supabase Auth y asigna el rol `owner` siguiendo `docs/SETUP.md`.
4. Copia `.env.example` a `.env.local` y completa las variables.
5. Ejecuta `npm install` y `npm run dev`.

Nunca subas contraseñas, `.env.local` ni claves secretas al repositorio. El esquema debe usar RLS en cada tabla y el registro público debe permanecer desactivado.

## Estado
Proyecto en desarrollo. No cargar datos reales ni desplegar para uso operativo hasta aplicar el esquema, probar el inicio de sesión y verificar todas las políticas de acceso.
