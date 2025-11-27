import { useEffect, useRef } from 'react';

interface GoogleMapProps {
  address: string;
  className?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ address, className = "" }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Crear iframe de Google Maps embebido
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3974.7399338498!2d-73.456789!3d5.54321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMzInMDcuMSJOIDczwrAyNycyNC4yIlc!5e0!3m2!1ses!2sco!4v1234567890`;
    iframe.width = "100%";
    iframe.height = "250";
    iframe.style.border = "0";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";

    // Limpiar el contenedor antes de agregar el iframe
    mapRef.current.innerHTML = '';
    mapRef.current.appendChild(iframe);

    return () => {
      if (mapRef.current && iframe) {
        mapRef.current.removeChild(iframe);
      }
    };
  }, [address]);

  return (
    <div className={`bg-gray-700 rounded-lg overflow-hidden ${className}`}>
      <div ref={mapRef} className="w-full h-64" />
      <div className="p-3 text-center">
        <p className="text-sm text-gray-300">
          📍 Institución Educativa San Pedro Claver
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Puerto Boyacá, Boyacá, Colombia
        </p>
      </div>
    </div>
  );
};

export default GoogleMap;
