import { useState, useEffect } from 'react';
import { getFooterConfig } from '../api/system';

interface FooterConfig {
  logo: string;
  desarrolladoPor: string;
  anio: string;
  institucion: string;
  mostrarLogo: boolean;
}

export function useFooterConfig() {
  const [config, setConfig] = useState<FooterConfig>({
    logo: '',
    desarrolladoPor: '1102 PROM 2025',
    anio: '2025',
    institucion: 'I.E. San Pedro Claver',
    mostrarLogo: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await getFooterConfig();
        setConfig(response.footer);
      } catch (error) {
        console.error('Error al cargar configuración del footer:', error);
        // Usar valores por defecto en caso de error
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, loading };
}
