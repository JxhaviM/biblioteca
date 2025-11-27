#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Leer LoansPage.tsx
with open('src/pages/LoansPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Agregar import de buildApiUrl al inicio (después de los imports de React)
if 'import { buildApiUrl }' not in content:
    content = content.replace(
        "import React, { useState, useEffect } from 'react';",
        "import React, { useState, useEffect } from 'react';\nimport { buildApiUrl } from '../config/api';"
    )

# 2. Reemplazar TODAS las URLs localhost
content = content.replace(
    'http://localhost:5000/api/loans/${approveModal.loanId}/approve',
    "' + buildApiUrl('/loans/' + approveModal.loanId + '/approve') + '"
)
content = content.replace(
    '`http://localhost:5000/api/loans/${approveModal.loanId}/approve`',
    "buildApiUrl('/loans/' + approveModal.loanId + '/approve')"
)

content = content.replace(
    'http://localhost:5000/api/loans/${loanId}/reject',
    "' + buildApiUrl('/loans/' + loanId + '/reject') + '"
)
content = content.replace(
    '`http://localhost:5000/api/loans/${loanId}/reject`',
    "buildApiUrl('/loans/' + loanId + '/reject')"
)

content = content.replace(
    'http://localhost:5000/api/loans/${extendModal.loanId}/extend',
    "' + buildApiUrl('/loans/' + extendModal.loanId + '/extend') + '"
)
content = content.replace(
    '`http://localhost:5000/api/loans/${extendModal.loanId}/extend`',
    "buildApiUrl('/loans/' + extendModal.loanId + '/extend')"
)

content = content.replace(
    'http://localhost:5000/api/loans/${returnModal.loanId}/return',
    "' + buildApiUrl('/loans/' + returnModal.loanId + '/return') + '"
)
content = content.replace(
    '`http://localhost:5000/api/loans/${returnModal.loanId}/return`',
    "buildApiUrl('/loans/' + returnModal.loanId + '/return')"
)

content = content.replace(
    'http://localhost:5000/api/loans?',
    "' + buildApiUrl('/loans?"
)
content = content.replace(
    '`http://localhost:5000/api/loans?',
    "buildApiUrl('/loans?"
)

content = content.replace(
    '`http://localhost:5000/api/loans/pending-count',
    "buildApiUrl('/loans/pending-count"
)

# 3. Reemplazar TODOS los Bearer tokens
content = content.replace(
    'Authorization: `Bearer ${token}`',
    "Authorization: 'Bearer ' + token"
)

# 4. Eliminar TODOS los emojis
content = content.replace('✅ ', '')
content = content.replace('❌ ', '')
content = content.replace('🔄 ', '')

# 5. Arreglar template strings problemáticos en alerts
content = content.replace(
    'alert(`Solicitud aprobada por ${approveModal.days} días`)',
    "alert('Solicitud aprobada por ' + approveModal.days + ' dias')"
)
content = content.replace(
    'alert(`Préstamo extendido por ${extendModal.days} días`)',
    "alert('Prestamo extendido por ' + extendModal.days + ' dias')"
)
content = content.replace(
    "alert('Solicitud rechazada')",
    "alert('Solicitud rechazada')"
)

# Escribir archivo
with open('src/pages/LoansPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ LoansPage.tsx COMPLETAMENTE RECREADO")
