# Reown AppKit Integration Guide

Este proyecto ya tiene Reown AppKit integrado para autenticación de wallets. Sigue estos pasos para configurarlo correctamente.

## 🚀 Configuración Rápida

### 1. Obtener Project ID de Reown

1. Ve a [Reown Dashboard](https://dashboard.reown.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Copia el **Project ID**

### 2. Configurar el Project ID

Edita el archivo `public/reown-config.js`:

```javascript
export const REOWN_CONFIG = {
  projectId: 'TU_PROJECT_ID_AQUI', // ← Reemplaza con tu Project ID real
  // ... resto de configuración
};
```

### 3. Probar la Integración

1. Ejecuta el servidor: `npm run dev`
2. Ve a `http://localhost:3000`
3. Haz clic en "🔗 Conectar con Reown"
4. Conecta tu wallet

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:
- `public/reown-login.html` - Página de login con Reown
- `public/reown-config.js` - Configuración de Reown
- `api/login.js` - Endpoint para servir la página de login
- `REOWN_SETUP.md` - Esta guía

### Archivos Modificados:
- `server.js` - Agregada ruta `/login`
- `vercel.json` - Agregado rewrite para `/login`
- Página principal - Agregado botón de conexión

## 🔧 Configuración Avanzada

### Redes Soportadas

Puedes agregar más redes en `public/reown-config.js`:

```javascript
export const REOWN_CONFIG = {
  // ...
  supportedNetworks: ['mainnet', 'arbitrum', 'polygon', 'base'],
  defaultNetwork: 'mainnet'
};
```

### Personalización de UI

Modifica los estilos en `public/reown-login.html`:

```css
:root { 
  --acc: #7dd3fc; /* Color principal */
  --bg: #0b1220;  /* Fondo */
  --card: #121a2a; /* Tarjetas */
}
```

## 🌐 Deployment

### Vercel
1. Sube el código a GitHub
2. Conecta el repo en Vercel
3. Configura las variables de entorno
4. Deploy automático

### Variables de Entorno Requeridas
```bash
# Reown (opcional, se puede configurar en el frontend)
REOWN_PROJECT_ID=tu_project_id

# Existente
RPC_URL=...
TOKEN_ADDRESS=...
PRIVATE_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...
ADMIN_TOKEN=...
```

## 🔗 Endpoints Disponibles

- `GET /` - Página principal con botón de conexión
- `GET /login` - Página de login con Reown
- `GET /dashboard` - Dashboard de campañas (requiere wallet conectada)
- `POST /api/generate` - Generar links (requiere admin token)
- `POST /api/claim` - Reclamar tokens
- `GET /claim/:id` - Página de claim

## 🛠️ Funcionalidades Implementadas

### ✅ Completado:
- [x] Integración básica de Reown AppKit
- [x] Página de login dedicada
- [x] Configuración centralizada
- [x] Soporte para múltiples redes
- [x] UI consistente con el diseño existente
- [x] Manejo de errores
- [x] Persistencia de conexión (localStorage)

### 🔄 Pendiente (Opcional):
- [ ] Integración con el sistema de autenticación existente
- [ ] Verificación de balance antes de claims
- [ ] Soporte para más tipos de wallets
- [ ] Analytics de conexiones
- [ ] Modo oscuro/claro

## 🐛 Solución de Problemas

### Error: "Project ID no configurado"
- Verifica que hayas editado `public/reown-config.js`
- Asegúrate de que el Project ID sea válido

### Error: "No se pudo conectar la wallet"
- Verifica que tengas una wallet instalada (MetaMask, etc.)
- Asegúrate de que la red esté configurada correctamente

### Error: "CORS" en desarrollo
- El proyecto está configurado para funcionar en producción
- Para desarrollo local, usa `npm run dev`

## 📚 Recursos Adicionales

- [Documentación de Reown](https://docs.reown.com/appkit/next/core/installation)
- [Reown Dashboard](https://dashboard.reown.com)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contribuir

Para agregar nuevas funcionalidades:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Implementa los cambios
4. Actualiza esta documentación
5. Envía un Pull Request

---

**Nota**: Este proyecto usa Express.js, no Next.js. La implementación de Reown está adaptada para funcionar con el stack actual.
