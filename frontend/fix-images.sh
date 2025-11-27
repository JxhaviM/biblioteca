#!/bin/bash

# Script para actualizar todas las referencias de imágenes de libros

echo "🔧 Actualizando referencias de imágenes de libros..."

# Archivos que contienen referencias a coverImage con localhost:5000
files=$(grep -r "localhost:5000.*coverImage" src/ --include="*.tsx" --include="*.ts" -l)

for file in $files; do
    echo "Procesando: $file"
    
    # Agregar import si no existe
    if ! grep -q "buildMediaUrl" "$file"; then
        # Buscar la línea del último import y agregar después
        sed -i "/^import.*from/r import { buildMediaUrl } from '../config/api';" "$file"
    fi
    
    # Reemplazar las URLs de imágenes
    sed -i 's|`http://localhost:5000\([^`]*coverImage[^`]*\)`|`${buildMediaUrl("\1")}|g' "$file"
    sed -i 's|http://localhost:5000\([^)]*coverImage[^)]*\)|buildMediaUrl("\1")|g' "$file"
    sed -i "s|'http://localhost:5000\([^']*coverImage[^']*\)'|buildMediaUrl('\1')|g" "$file"
done

echo "✅ Actualización completada!"
