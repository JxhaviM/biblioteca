import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

interface HistoryItem {
  id: string;
  persona: { id: string; nombre: string; doc: string; grado?: string; grupo?: string };
  checkInTime: string;
  checkOutTime?: string;
  stayDuration?: number | null;
}

const AttendanceHistoryPage: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [q, setQ] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('fechaInicio', startDate);
      if (endDate) params.append('fechaFin', endDate);
      const resp = await fetch(`${API_BASE_URL}/attendance/history?${params.toString()}&_t=${Date.now()}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await resp.json();
      if (data.success) setItems(Array.isArray(data.data) ? data.data : []);
      else setItems([]);
    } catch (e) {
      console.error('history error', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = items.filter(it => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      (it.persona?.nombre || '').toLowerCase().includes(s) ||
      (it.persona?.doc || '').toLowerCase().includes(s) ||
      (it.persona?.grado || '').toLowerCase().includes(s) ||
      (it.persona?.grupo || '').toLowerCase().includes(s)
    );
  });

  const exportCSV = () => {
    const header = ['Nombre','Documento','Grado','Grupo','Entrada','Salida','Minutos'];
    const rows = filtered.map(it => [
      it.persona?.nombre || '',
      it.persona?.doc || '',
      it.persona?.grado || '',
      it.persona?.grupo || '',
      new Date(it.checkInTime).toLocaleString('es-CO'),
      it.checkOutTime ? new Date(it.checkOutTime).toLocaleString('es-CO') : '',
      (it.stayDuration ?? '')
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'historial_asistencias.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-4">Historial de Asistencias</h1>
        <div className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Desde</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Hasta</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Buscar</label>
            <input type="text" value={q} onChange={e=>setQ(e.target.value)} placeholder="Nombre, doc, grado o grupo" className="w-full px-3 py-2 border rounded" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={fetchHistory} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">{loading?'Cargando...':'Buscar'}</button>
            <button onClick={exportCSV} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">Exportar CSV</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salida</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{item.persona?.nombre || ''}</td>
                  <td className="px-4 py-3">{item.persona?.doc || ''}</td>
                  <td className="px-4 py-3">{item.persona?.grado || ''}</td>
                  <td className="px-4 py-3">{item.persona?.grupo || ''}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(item.checkInTime).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.checkOutTime ? new Date(item.checkOutTime).toLocaleString('es-CO') : '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistoryPage;
