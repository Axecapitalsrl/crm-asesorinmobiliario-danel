# Condominio Elsita — landing RE/MAX Legacy

Landing responsive de presentación y captación para la propiedad de Condominio Elsita, Santa Cruz. Abrir `index.html` en un navegador para revisar el diseño; para servirla localmente conviene usar cualquier servidor estático.

## Integración CRM pendiente

Revisé `Axecapitalsrl/crm-asesorinmobiliario-danel`: el CRM es Next.js + Supabase, pero su tabla `leads` solo tiene políticas RLS para el usuario propietario autenticado. No hay endpoint público para recibir prospectos. Por eso esta landing **no escribe aún en el CRM** y no abre WhatsApp si el guardado no fue confirmado; hacerlo desde el navegador con la clave pública de Supabase fallaría por RLS, y usar una clave `service_role` en la landing expondría acceso privilegiado a la base.

El formulario ya envía el siguiente contrato a `POST /api/public/leads`:

```json
{
  "name": "Nombre del prospecto",
  "phone": "Número de WhatsApp",
  "email": "correo opcional",
  "lead_type": "buyer o investor",
  "source": "website",
  "property": "Condominio Elsita",
  "interest": "opción elegida",
  "notes": "Consulta de la landing",
  "consent": true,
  "campaign": { "utm_source": "...", "utm_campaign": "..." }
}
```

El CRM debe implementar esa ruta en el servidor, validar y limitar solicitudes, y guardar el lead con credenciales solo del servidor. La migración actual tiene campos suficientes para nombre, teléfono, email, tipo, fuente y notas; `property` e `interest` se pueden incluir en `notes` y enlazar luego con la ficha de propiedad. La ruta debe devolver una respuesta exitosa solo después del guardado. Entonces el navegador redirige a WhatsApp con nombre, teléfono, correo e interés precargados.

## Recomendación para el repositorio

Mantener la landing en **el mismo repositorio del CRM**, dentro de `public/elsita/` (esta carpeta), y servirla bajo `/elsita`. Así usa el mismo despliegue de Vercel y el endpoint del servidor queda en el mismo origen. Integrar en una rama separada y revisar antes de fusionar protege el dashboard existente. No hace falta crear otro repositorio para esta propiedad. No subí cambios al GitHub.

El WhatsApp indicado ya está configurado en `config.js`: `+591 778 19696` (formato internacional sin `+` para `wa.me`).

## Contenido visual

- Fotos originales incluidas en WebP optimizado y listas para la galería.
- Marca RE/MAX recortada desde el PNG suministrado para evitar el gran margen transparente/negro.
- Paleta oficial indicada: rojo `#ff1200`, azul `#0043ff`, crema `#f7f5ee`.
- El texto de precio dice USD 155.000; confirmar vigencia y disponibilidad antes de pautar.

## Para publicar

1. Incorporar `outputs/elsita/` al repositorio del CRM como `public/elsita/`.
2. Implementar `POST /api/public/leads` en el servidor del CRM con protección contra spam, validación y guardado seguro en Supabase.
3. Probar un lead de punta a punta en entorno de prueba: registro en CRM, luego redirección con mensaje correcto a WhatsApp.
4. Validar desde móvil, configurar dominio y analítica de campaña, y desplegar.
