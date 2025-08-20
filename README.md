# Chingadrop.xyz - Token Distribution Platform

Distribuye tokens ERC-20 por medio de **links de un solo uso**, usando una **hot wallet** controlada por el backend (sin contrato). Listo para desplegar en **Vercel**.

## Estructura
- `api/generate.js` — Genera N links; protegido con `ADMIN_TOKEN`.
- `api/claim.js` — Reclama un link y ejecuta la transferencia ERC-20.
- `api/claim-view.js` — Vista HTML estilizada para `/claim/:id`.
- `lib/db.js` — Adaptador **Supabase** con reserva/rollback.
- `lib/schema.sql` — Script SQL para crear tabla `claims`.
- `vercel.json` — Builds y rewrite de `/claim/:id`.
- `.env.example` — Variables requeridas.
- `package.json` — Dependencias (`ethers`, `@supabase/supabase-js`).

## Setup

1) **Supabase**
- Crea un proyecto y en SQL Editor ejecuta `lib/schema.sql`.

2) **Variables de entorno** (Vercel)
```
RPC_URL=...
TOKEN_ADDRESS=0x...
PRIVATE_KEY=0x...
TOKEN_DECIMALS=18
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE=<service role key>
ADMIN_TOKEN=<strong token>
```

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

## Notas
- `reserve(id)` marca el claim como `processing` para evitar doble gasto.
- En caso de error on-chain, se hace `rollback` a `new`.
- Recomendado añadir **rate limiting** (Upstash) y **captcha**.
- **Seguridad**: La `Service Role` NUNCA en el cliente, sólo en serverless.

---

MIT © 2025
