import React, { useState } from 'react';

interface CredencialUsuario {
  nombre: string;
  documento: string;
  username: string;
  password: string;
  grupo: string;
  tipoPersona: string;
}

interface CredencialesGeneradasModalProps {
  isOpen: boolean;
  onClose: () => void;
  credenciales: CredencialUsuario[];
  grado?: string;
  grupo?: string;
}

const CredencialesGeneradasModal: React.FC<CredencialesGeneradasModalProps> = ({
  isOpen,
  onClose,
  credenciales,
  grado,
  grupo
}) => {
  const [copiado, setCopiado] = useState<number | null>(null);

  if (!isOpen) return null;

  // Función para copiar credenciales individuales
  const copiarCredencial = (credencial: CredencialUsuario, index: number) => {
    const texto = `Credenciales de Acceso
Nombre: ${credencial.nombre}
Documento: ${credencial.documento}
Usuario: ${credencial.username}
Contraseña: ${credencial.password}
Grupo: ${credencial.grupo}`;

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(index);
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  // Función para copiar todas las credenciales
  const copiarTodas = () => {
    const texto = credenciales.map(cred => 
      `${cred.nombre} | Doc: ${cred.documento} | Usuario: ${cred.username} | Contraseña: ${cred.password} | Grupo: ${cred.grupo}`
    ).join('\n');

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(-1);
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  // Función para descargar en formato CSV
  const descargarCSV = () => {
    const headers = ['Nombre', 'Documento', 'Usuario', 'Contraseña', 'Grupo', 'Tipo'];
    const rows = credenciales.map(cred => [
      cred.nombre,
      cred.documento,
      cred.username,
      cred.password,
      cred.grupo,
      cred.tipoPersona
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `credenciales_${grado || 'usuarios'}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para descargar en formato TXT
  const descargarTXT = () => {
    const texto = `CREDENCIALES DE ACCESO AL SISTEMA
Grado: ${grado || 'N/A'}
Grupo: ${grupo || 'N/A'}
Fecha: ${new Date().toLocaleString('es-ES')}
Total de usuarios: ${credenciales.length}

========================================

${credenciales.map((cred, index) => `
${index + 1}. ${cred.nombre}
   Documento: ${cred.documento}
   Usuario: ${cred.username}
   Contraseña: ${cred.password}
   Grupo: ${cred.grupo}
   Tipo: ${cred.tipoPersona}
   ----------------------------------------
`).join('\n')}

IMPORTANTE:
- Los usuarios deben cambiar su contraseña en el primer inicio de sesión
- La contraseña inicial es el número de documento
- Para cualquier problema contactar al administrador del sistema
`;

    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `credenciales_${grado || 'usuarios'}_${Date.now()}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para imprimir credenciales
  const imprimirCredenciales = () => {
    const contenido = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Credenciales de Acceso</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .credencial { border: 1px solid #ddd; margin: 10px 0; padding: 15px; page-break-inside: avoid; }
    .credencial h3 { color: #333; margin: 0 0 10px 0; }
    .campo { margin: 5px 0; }
    .campo strong { display: inline-block; width: 100px; }
    .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; }
    @media print {
      body { margin: 10px; }
      .credencial { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 CREDENCIALES DE ACCESO - BIBLIOTECA</h1>
    <h2>Grado: ${grado || 'N/A'} ${grupo ? `- Grupo: ${grupo}` : ''}</h2>
    <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
    <p>Total de usuarios: ${credenciales.length}</p>
  </div>

  ${credenciales.map((cred, index) => `
  <div class="credencial">
    <h3>${index + 1}. ${cred.nombre}</h3>
    <div class="campo"><strong>Documento:</strong> ${cred.documento}</div>
    <div class="campo"><strong>Usuario:</strong> ${cred.username}</div>
    <div class="campo"><strong>Contraseña:</strong> ${cred.password}</div>
    <div class="campo"><strong>Grupo:</strong> ${cred.grupo}</div>
    <div class="campo"><strong>Tipo:</strong> ${cred.tipoPersona}</div>
  </div>
  `).join('')}

  <div class="footer">
    <p><strong>IMPORTANTE:</strong></p>
    <ul>
      <li>Los usuarios deben cambiar su contraseña en el primer inicio de sesión</li>
      <li>La contraseña inicial es el número de documento</li>
      <li>Para cualquier problema contactar al administrador del sistema</li>
    </ul>
  </div>
</body>
</html>
`;

    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(contenido);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => {
        ventana.print();
        ventana.close();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">✅ Usuarios Creados Exitosamente</h2>
              <p className="text-green-100">
                Se han creado {credenciales.length} usuario(s) {grado && `para el grado ${grado}`}
                {grupo && ` - Grupo ${grupo}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Advertencia */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                ⚠️ Información Importante
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Descarga o copia estas credenciales AHORA. No se podrán recuperar después.</li>
                  <li>Los usuarios deberán cambiar su contraseña en el primer inicio de sesión.</li>
                  <li>La contraseña inicial es el número de documento de cada persona.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 border-b">
          <button
            onClick={copiarTodas}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {copiado === -1 ? (
              <>
                <span>✓</span>
                <span>¡Copiadas!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copiar Todas</span>
              </>
            )}
          </button>
          
          <button
            onClick={descargarCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Descargar CSV</span>
          </button>
          
          <button
            onClick={descargarTXT}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Descargar TXT</span>
          </button>
          
          <button
            onClick={imprimirCredenciales}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Imprimir</span>
          </button>
        </div>

        {/* Lista de credenciales */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {credenciales.map((cred, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {cred.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cred.nombre}</h3>
                        <p className="text-sm text-gray-500">{cred.tipoPersona}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Documento</p>
                        <p className="font-mono font-medium text-gray-900">{cred.documento}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Grupo</p>
                        <p className="font-medium text-gray-900">{cred.grupo}</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-xs text-blue-600">👤 Usuario</p>
                        <p className="font-mono font-medium text-blue-900">{cred.username}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs text-green-600">🔑 Contraseña</p>
                        <p className="font-mono font-medium text-green-900">{cred.password}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => copiarCredencial(cred, index)}
                    className="ml-4 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center space-x-1"
                    title="Copiar credenciales"
                  >
                    {copiado === index ? (
                      <>
                        <span className="text-green-600">✓</span>
                        <span className="text-sm">Copiado</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CredencialesGeneradasModal;
