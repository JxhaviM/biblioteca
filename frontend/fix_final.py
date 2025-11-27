#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Arreglar LoansPage.tsx
with open('src/pages/LoansPage.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Agregar import al principio si no existe
has_import = any('buildApiUrl' in line for line in lines[:30])
if not has_import:
    for i in range(len(lines)):
        if 'import' in lines[i] and i < 20:
            continue
        elif 'import' not in lines[i] and i > 0:
            lines.insert(i, "import { buildApiUrl } from '../config/api';\n")
            break

# Arreglar línea por línea SIN regex
for i in range(len(lines)):
    # Línea ~137 (ahora 138 con el import): localhost a buildApiUrl
    if 'http://localhost:5000/api/loans/${approveModal.loanId}/approve' in lines[i]:
        lines[i] = "      const resp = await fetch(buildApiUrl('/loans/' + approveModal.loanId + '/approve'), {\n"
    
    # Línea ~141: Authorization Bearer
    if "Authorization: `Bearer ${token}`" in lines[i]:
        lines[i] = lines[i].replace("Authorization: `Bearer ${token}`", "Authorization: 'Bearer ' + token")
    
    # Línea ~197: localhost a buildApiUrl (reject)
    if 'http://localhost:5000/api/loans/${loanId}/reject' in lines[i]:
        lines[i] = "      const resp = await fetch(buildApiUrl('/loans/' + loanId + '/reject'), {\n"

# Escribir de vuelta
with open('src/pages/LoansPage.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✓ LoansPage.tsx arreglado")

# Arreglar CreateLoanModal.tsx  
with open('src/components/CreateLoanModal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Agregar import
has_import = any('buildApiUrl' in line for line in lines[:30])
if not has_import:
    for i in range(len(lines)):
        if "import React" in lines[i]:
            lines.insert(i + 1, "import { buildApiUrl } from '../config/api';\n")
            break

# Arreglar línea por línea
for i in range(len(lines)):
    # Línea 454: confirm con template string
    if 'confirm(`¿Crear usuario para ${editingPerson.name}?`)' in lines[i]:
        lines[i] = lines[i].replace('confirm(`¿Crear usuario para ${editingPerson.name}?`)', "confirm('Crear usuario para ' + editingPerson.name + '?')")
    
    # Línea 457: localhost a buildApiUrl
    if 'http://localhost:5000/api/auth/create-user-from-person/${editingPerson._id}' in lines[i]:
        lines[i] = lines[i].replace('`http://localhost:5000/api/auth/create-user-from-person/${editingPerson._id}`', "buildApiUrl('/auth/create-user-from-person/' + editingPerson._id)")
    
    # Authorization Bearer
    if "Authorization: `Bearer ${token}`" in lines[i]:
        lines[i] = lines[i].replace("Authorization: `Bearer ${token}`", "Authorization: 'Bearer ' + token")

# Escribir de vuelta
with open('src/components/CreateLoanModal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✓ CreateLoanModal.tsx arreglado")
print("\n✓ TODOS LOS ARCHIVOS ARREGLADOS")
