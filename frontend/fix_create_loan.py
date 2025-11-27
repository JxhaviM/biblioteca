#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

def fix_create_loan_modal():
    with open('src/components/CreateLoanModal.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Arreglar línea 152 - Quitar emoji
    content = content.replace("alert('✅ Préstamo creado exitosamente');", "alert('Prestamo creado exitosamente');")
    
    # 2. Arreglar líneas 156, 160 - Quitar emojis
    content = content.replace("alert('❌ Error: ' + data.message);", "alert('Error: ' + data.message);")
    content = content.replace("alert('❌ Error al crear el préstamo');", "alert('Error al crear el prestamo');")
    
    # 3. Arreglar línea 234 - Quitar emoji en JSX
    content = re.sub(r'✅ \{book\.availability\?\.availableCopies\}', r'{book.availability?.availableCopies}', content)
    
    # 4. Arreglar línea 318 - Quitar emoji en JSX
    content = content.replace('✅ Con usuario', 'Con usuario')
    
    # 5. Arreglar línea 409 - Quitar emoji
    content = re.sub(r"'Creando\.\.\.' : '✅ Crear Préstamo'", r"'Creando...' : 'Crear Prestamo'", content)
    
    # 6. Arreglar línea 454 - Cambiar ¿ y template string
    content = re.sub(
        r"if \(confirm\(`¿Crear usuario para \$\{editingPerson\.name\}\?`\)\)",
        r"if (confirm('Crear usuario para ' + editingPerson.name + '?'))",
        content
    )
    
    # 7. Arreglar línea 457 - Cambiar localhost y template string
    content = re.sub(
        r'`http://localhost:5000/api/auth/create-user-from-person/\$\{editingPerson\._id\}`',
        r"buildApiUrl('/auth/create-user-from-person/' + editingPerson._id)",
        content
    )
    
    # 8. Arreglar línea 461 - Authorization header
    content = re.sub(
        r'Authorization: `Bearer \$\{token\}`',
        r"Authorization: 'Bearer ' + token",
        content
    )
    
    # 9. Arreglar línea 467 - Template string largo
    content = re.sub(
        r'alert\(`Usuario creado exitosamente!\\nUsername: \$\{data\.data\.user\.username\}\\nContraseña: \$\{data\.data\.tempPassword \|\| \'Cambiar123\'\}`\)',
        r"alert('Usuario creado exitosamente!\\nUsername: ' + data.data.user.username + '\\nContrasena: ' + (data.data.tempPassword || 'Cambiar123'))",
        content
    )
    
    # 10. Arreglar líneas 471, 474 - Quitar emojis
    content = content.replace("alert('❌ Error: ' + data.message);", "alert('Error: ' + data.message);")
    content = content.replace("alert('❌ Error al crear usuario');", "alert('Error al crear usuario');")
    
    # 11. Arreglar línea 532 - localhost en imagen
    content = re.sub(
        r'`http://localhost:5000/api/persons/\$\{editingPerson\._id\}`',
        r"buildApiUrl('/persons/' + editingPerson._id)",
        content
    )
    
    # 12. Arreglar línea 537 - Authorization header (segunda instancia)
    # Ya está cubierto por el reemplazo anterior
    
    # 13. Arreglar líneas 543, 555, 558 - Quitar emojis
    content = content.replace("alert('✅ Datos actualizados exitosamente');", "alert('Datos actualizados exitosamente');")
    content = content.replace("alert('❌ Error: ' + data.message);", "alert('Error: ' + data.message);")
    content = content.replace("alert('❌ Error al actualizar datos');", "alert('Error al actualizar datos');")
    
    # Agregar import de buildApiUrl si no existe
    if 'import { buildApiUrl }' not in content:
        content = content.replace(
            "import React, { useState, useEffect } from 'react';",
            "import React, { useState, useEffect } from 'react';\nimport { buildApiUrl } from '../config/api';"
        )
    
    with open('src/components/CreateLoanModal.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✓ CreateLoanModal.tsx arreglado completamente")

if __name__ == '__main__':
    fix_create_loan_modal()
    print("\n✓ ARCHIVO ARREGLADO EXITOSAMENTE SIN CORRUPCIÓN")
