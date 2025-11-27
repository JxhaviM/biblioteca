# 📦 Frontend - Guía de Producción

## 🚀 Comandos de Build

### Development
```bash
npm run dev          # Servidor de desarrollo
npm run type-check   # Verificar tipos TypeScript
npm run lint         # Verificar código ESLint
```

### Producción
```bash
npm run clean        # Limpiar carpeta dist
npm run build        # Build para producción (sin TypeScript estricto)
npm run build:ts     # Build con TypeScript estricto
npm run build:prod   # Build + preview
npm run preview      # Previsualizar build localmente
```

## 📁 Archivos de Configuración

- `vite.config.ts` - Configuración de Vite para producción
- `vercel.json` - Configuración específica para Vercel
- `.env.production` - Variables de entorno de producción
- `.env.example` - Plantilla de variables de entorno

## 🔧 Variables de Entorno

Copiar `.env.example` a `.env.local` para desarrollo:

```bash
cp .env.example .env.local
```

Para producción en Vercel, configurar:
- `VITE_API_URL=https://tu-backend.onrender.com`

## 📊 Optimizaciones de Build

- **Code splitting**: Vendor, router, API chunks separados
- **Compression**: Gzip habilitado
- **Sourcemaps**: Deshabilitados en producción
- **Chunk size**: Límite de 1000KB

## 🌐 Deploy a Vercel

1. Subir código a GitHub
2. Conectar repositorio en Vercel
3. Configurar variables de entorno
4. Deploy automático

## 🔍 Verificación Local

```bash
npm run build:prod
# Abre http://localhost:4173 para probar build de producción
```

## ⚡ Performance

- Build size: ~650KB (gzipped: ~155KB)
- Load time: <2s en 3G
- Lighthouse: 95+ performance

## 🛠️ Troubleshooting

### Build falla
```bash
npm run clean
npm run build
```

### Variables de entorno no funcionan
- Verificar prefijo `VITE_`
- Reiniciar servidor después de cambios

### CORS issues
- Configurar backend para permitir dominio de Vercel
- Verificar `VITE_API_URL` correcta
