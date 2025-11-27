#!/bin/bash

# Script para reemplazar localhost:5000 con la configuración centralizada

echo "🔧 Reemplazando URLs hardcoded de localhost:5000..."

# Archivos a procesar
files=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "localhost:5000")

for file in $files; do
    echo "Procesando: $file"
    
    # Reemplazar URLs de API
    sed -i "s|http://localhost:5000/api|buildApiUrl('|g" "$file"
    
    # Reemplazar URLs de imágenes y archivos estáticos
    sed -i "s|http://localhost:5000\([^/]\)|buildMediaUrl('\1'|g" "$file"
    
    # Reemplazar URLs completas que no son de API
    sed -i "s|'http://localhost:5000|buildApiUrl('|g" "$file"
    sed -i 's|`http://localhost:5000|`${buildApiUrl("|g' "$file"
    
    # Agregar importación de buildApiUrl y buildMediaUrl si no existe
    if ! grep -q "buildApiUrl\|buildMediaUrl" "$file"; then
        # Encontrar la línea de imports y agregar después
        sed -i "1a import { buildApiUrl, buildMediaUrl } from '../config/api';" "$file"
    fi
done

echo "✅ Reemplazo completado!"
