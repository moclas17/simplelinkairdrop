# 📱 Guía de Instalación PWA en Android

## 🎯 URL para acceder desde Android:
```
http://192.168.100.194:3001
```

## 📋 Pasos para instalar la PWA en Android:

### Método 1: Instalación Manual (Siempre funciona)
1. **Abre Chrome** en tu dispositivo Android
2. **Navega** a: `http://192.168.100.194:3001`
3. **Toca el menú** de Chrome (los 3 puntos verticales **⋮**)
4. **Busca la opción** "Agregar a pantalla de inicio" o "Add to Home screen"
5. **Toca "Agregar"** en el diálogo que aparece
6. **¡Listo!** La app aparecerá en tu pantalla de inicio

### Método 2: Banner Automático (Si aparece)
1. **Visita la página** varias veces
2. **Espera** a que aparezca el banner "Agregar a pantalla de inicio"
3. **Toca "Instalar"** cuando aparezca el prompt

## 🔧 ¿Por qué no aparece el prompt automático?

### Factores comunes:
- **Chrome versión:** Necesitas Chrome 76+ en Android
- **Engagement:** Chrome requiere que uses la app varias veces
- **Tiempo:** A veces toma varios minutos para aparecer
- **HTTPS:** Algunos dispositivos solo muestran el prompt con HTTPS

### Soluciones:
1. **Usa instalación manual** (Método 1) - siempre funciona
2. **Recarga la página** varias veces
3. **Navega por la app** (ve a /claim/test, vuelve al inicio)
4. **Espera 2-3 minutos** y revisa el menú de Chrome

## ✅ Verificar instalación exitosa:
- Busca el ícono **💎 Chingadrop** en tu pantalla de inicio
- La app debe abrir en modo pantalla completa (sin barra de direcciones)
- Debe funcionar sin internet (modo offline)

## 🐛 Debugging:
- En Chrome desktop: chrome://inspect → conecta tu Android via USB
- En DevTools: Application tab → Manifest → verificar PWA criteria
- Console logs: revisa mensajes que empiecen con [PWA]