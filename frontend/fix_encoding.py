#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

# Leer LoansPage.tsx
with open('src/pages/LoansPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Reemplazos seguros - eliminando emojis y template strings problemáticos
replacements = [
    (r'alert\(`✅ Solicitud aprobada por \$\{approveModal\.days\} días`\)', 
     "alert('Solicitud aprobada por ' + approveModal.days + ' dias')"),
    (r"alert\('✅ Solicitud rechazada'\)", 
     "alert('Solicitud rechazada')"),
    (r'\? `Solicitud: \$\{new Date\(loan\.createdAt\)\.toLocaleDateString\(\'es-CO\'\)\}`',
     "? 'Solicitud: ' + new Date(loan.createdAt).toLocaleDateString('es-CO')"),
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Escribir archivo
with open('src/pages/LoansPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ LoansPage.tsx actualizado")

# Leer CreateLoanModal.tsx
with open('src/components/CreateLoanModal.tsx', 'r', encoding='utf-8') as f:
    content2 = f.read()

# Reemplazos para CreateLoanModal
replacements2 = [
    (r'alert\(`✅ Usuario creado exitosamente!\\nUsername: \$\{data\.data\.user\.username\}\\nContraseña: \$\{data\.data\.tempPassword \|\| \'Cambiar123\'\}`\)',
     "alert('Usuario creado exitosamente!\\nUsername: ' + data.data.user.username + '\\nContrasena: ' + (data.data.tempPassword || 'Cambiar123'))"),
    (r'Authorization: `Bearer \$\{token\}`',
     "Authorization: 'Bearer ' + token"),
]

for pattern, replacement in replacements2:
    content2 = re.sub(pattern, replacement, content2)

# Escribir archivo
with open('src/components/CreateLoanModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content2)

print("✓ CreateLoanModal.tsx actualizado")
