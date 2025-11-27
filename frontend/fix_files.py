#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def fix_loans_page():
    with open('src/pages/LoansPage.tsx', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Arreglar líneas específicas sin tocar el resto del archivo
    for i, line in enumerate(lines):
        # Línea 137: Cambiar localhost:5000 a buildApiUrl
        if i == 136 and 'http://localhost:5000/api/loans' in line:
            lines[i] = line.replace('http://localhost:5000/api/loans', 'buildApiUrl(\'/loans')
            lines[i] = lines[i].replace('}/approve', '\')/approve')
        
        # Línea 141: Cambiar Bearer template string
        if i == 140 and 'Authorization: `Bearer ${token}`' in line:
            lines[i] = line.replace('Authorization: `Bearer ${token}`', "Authorization: 'Bearer ' + token")
        
        # Línea 147: Quitar emoji
        if i == 146 and '✅' in line:
            lines[i] = line.replace('✅ ', '')
        
        # Línea 155: Quitar emoji
        if i == 154 and '❌' in line:
            lines[i] = line.replace('❌ ', '')
        
        # Línea 197: Cambiar localhost:5000 a buildApiUrl
        if i == 196 and 'http://localhost:5000/api/loans' in line:
            lines[i] = line.replace('http://localhost:5000/api/loans', 'buildApiUrl(\'/loans')
            lines[i] = lines[i].replace('}/reject', '\')/reject')
        
        # Línea 201: Cambiar Bearer template string
        if i == 200 and 'Authorization: `Bearer ${token}`' in line:
            lines[i] = line.replace('Authorization: `Bearer ${token}`', "Authorization: 'Bearer ' + token")
        
        # Línea 207: Quitar emoji
        if i == 206 and '✅' in line:
            lines[i] = line.replace('✅ ', '')
        
        # Línea 214: Quitar emoji
        if i == 213 and '❌' in line:
            lines[i] = line.replace('❌ ', '')
    
    # Agregar import de buildApiUrl si no existe
    has_import = False
    for line in lines:
        if 'import { buildApiUrl }' in line:
            has_import = True
            break
    
    if not has_import:
        # Buscar la línea después de los otros imports
        for i, line in enumerate(lines):
            if line.startswith('import') and i < 20:
                continue
            elif not line.startswith('import') and i > 0:
                lines.insert(i, "import { buildApiUrl } from '../config/api';\n")
                break
    
    with open('src/pages/LoansPage.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("✓ LoansPage.tsx arreglado")

def fix_create_loan_modal():
    with open('src/components/CreateLoanModal.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazos seguros
    content = content.replace('`¿Crear usuario para ${editingPerson.name}?`', "'Crear usuario para ' + editingPerson.name + '?'")
    content = content.replace('`http://localhost:5000/api/auth/create-user-from-person/${editingPerson._id}`', "buildApiUrl('/auth/create-user-from-person/' + editingPerson._id)")
    content = content.replace('Authorization: `Bearer ${token}`', "Authorization: 'Bearer ' + token")
    
    # Quitar TODOS los emojis
    content = content.replace('✅ ', '')
    content = content.replace('❌ ', '')
    content = content.replace('🔄 ', '')
    
    # Asegurar que tiene el import
    if 'import { buildApiUrl }' not in content:
        # Agregar después del primer import
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('import') and 'React' in line:
                lines.insert(i + 1, "import { buildApiUrl } from '../config/api';")
                break
        content = '\n'.join(lines)
    
    with open('src/components/CreateLoanModal.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✓ CreateLoanModal.tsx arreglado")

if __name__ == '__main__':
    fix_loans_page()
    fix_create_loan_modal()
    print("\n✓ TODOS LOS ARCHIVOS ARREGLADOS EXITOSAMENTE")
