# Chingadrop.xyz - Token Distribution Platform

Distribuye tokens ERC-20 por medio de **links de un solo uso**, usando una **hot wallet** controlada por el backend (sin contrato). Integrado con **Reown AppKit** para autenticación de wallets. Listo para desplegar en **Vercel**.

## Estructura
- `api/generate.js` — Genera N links; protegido con `ADMIN_TOKEN`.
- `api/claim.js` — Reclama un link y ejecuta la transferencia ERC-20.
- `api/claim-view.js` — Vista HTML estilizada para `/claim/:id`.
- `api/login.js` — Página de login con Reown AppKit.
- `api/dashboard.js` — Dashboard de campañas para usuarios.
- `lib/db.js` — Adaptador **Supabase** con reserva/rollback.
- `lib/schema.sql` — Script SQL para crear tabla `claims`.
- `public/reown-login.html` — Interfaz de login con Reown.
- `public/reown-config.js` — Configuración de Reown AppKit.

## Setup

### 1) **Reown AppKit** (Nuevo)
- Ve a [Reown Dashboard](https://dashboard.reown.com) y crea un proyecto
- Copia el Project ID y edita `public/reown-config.js`
- Ver [REOWN_SETUP.md](./REOWN_SETUP.md) para detalles completos

### 2) **Supabase**
- Crea un proyecto y en SQL Editor ejecuta `lib/schema.sql`.


3) **Instalar deps y deploy**
```bash
npm i
# dev local (opcional, requiere `vercel` CLI):
vercel dev
# producción: sube el repo a GitHub y conecta en Vercel
```

## Uso

### Generar links (admin)
```bash
curl -X POST https://tu-app.vercel.app/api/generate \
  -H 'Content-Type: application/json' \
  -H 'x-admin-token: $ADMIN_TOKEN' \
  -d '{"count": 10, "amount": 10, "expiresInHours": 48}'
```
Respuesta: `{"links":[ "https://tu-app.vercel.app/claim/<id>", ...], "expires_at":"..."}`

### Reclamar
- Visita `/claim/<id>` → pega tu dirección → **Claim tokens**.
- El backend transfiere desde la hot wallet y marca el link como usado.

### Dashboard de Usuario
- Ve a `/login` → conecta tu wallet con Reown → **Dashboard**.
- Crea y gestiona tus propias campañas de distribución.

## Notas
- `reserve(id)` marca el claim como `processing` para evitar doble gasto.
- En caso de error on-chain, se hace `rollback` a `new`.
- **Reown AppKit**: Integrado para autenticación de wallets moderna.
- Recomendado añadir **rate limiting** (Upstash) y **captcha**.
- **Seguridad**: La `Service Role` NUNCA en el cliente, sólo en serverless.

---

MIT © 2025
