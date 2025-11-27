#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Leer archivo línea por línea
with open('src/pages/LoansPage.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Agregar import después de la primera línea de import
import_added = False
for i, line in enumerate(lines):
    if not import_added and "import React" in line:
        lines.insert(i + 1, "import { buildApiUrl } from '../config/api';\n")
        import_added = True
        break

# Ahora arreglar líneas específicas
for i, line in enumerate(lines):
    # Línea ~137: fetch approve
    if 'http://localhost:5000/api/loans/${approveModal.loanId}/approve' in line:
        lines[i] = "      const resp = await fetch(buildApiUrl('/loans/' + approveModal.loanId + '/approve'), {\n"
    
    # Línea ~142: Authorization Bearer en approve
    elif i > 130 and i < 150 and 'Authorization: `Bearer ${token}`' in line:
        lines[i] = line.replace('Authorization: `Bearer ${token}`', "Authorization: 'Bearer ' + token")
    
    # Línea ~147: alert aprobado
    elif 'alert(`✅ Solicitud aprobada por ${approveModal.days} días`)' in line:
        lines[i] = "        alert('Solicitud aprobada por ' + approveModal.days + ' dias');\n"
    
    # Línea ~155: alert error
    elif "alert('❌ ' + (data.message" in line:
        lines[i] = line.replace("alert('❌ '", "alert('Error: '")
    
    # Línea ~167: fetch extend
    elif 'http://localhost:5000/api/loans/${extendModal.loanId}/extend' in line:
        lines[i] = "      const resp = await fetch(buildApiUrl('/loans/' + extendModal.loanId + '/extend'), {\n"
    
    # Línea ~172: Authorization Bearer en extend
    elif i > 160 and i < 180 and 'Authorization: `Bearer ${token}`' in line:
        lines[i] = line.replace('Authorization: `Bearer ${token}`', "Authorization: 'Bearer ' + token")
    
    # Línea ~182: alert extendido
    elif 'alert(`✅ Préstamo extendido por ${extendModal.days} días`)' in line:
        lines[i] = "        alert('Prestamo extendido por ' + extendModal.days + ' dias');\n"
    
    # Línea ~197: fetch reject
    elif 'http://localhost:5000/api/loans/${loanId}/reject' in line:
        lines[i] = "      const resp = await fetch(buildApiUrl('/loans/' + loanId + '/reject'), {\n"
    
    # Línea ~202: Authorization Bearer en reject  
    elif i > 195 and i < 210 and 'Authorization: `Bearer ${token}`' in line:
        lines[i] = line.replace('Authorization: `Bearer ${token}`', "Authorization: 'Bearer ' + token")
    
    # Línea ~207: alert rechazada (quitar emoji)
    elif "alert('✅ Solicitud rechazada')" in line:
        lines[i] = "        alert('Solicitud rechazada');\n"
    
    # Línea ~445: template string con "Solicitud:"
    elif '`Solicitud: ${new Date(loan.createdAt).toLocaleDateString' in line:
        lines[i] = '                              ? "Solicitud: " + new Date(loan.createdAt).toLocaleDateString("es-CO")\n'

# Escribir archivo
with open('src/pages/LoansPage.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✓ LoansPage.tsx arreglado SIN corrupción")
