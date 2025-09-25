import * as React from 'react';
import { useState, useEffect, useRef } from 'react';

function App() {
  const [qrCodeModule, setQrCodeModule] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrValue, setQrValue] = useState('https://example.com');
  const [inputValue, setInputValue] = useState('https://example.com');
  
  // Cargar dinámicamente la biblioteca qrcode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('qrcode').then((module) => {
        setQrCodeModule(module);
      }).catch((error) => {
        console.error('Error al cargar qrcode:', error);
      });
    }
  }, []);

  // Efecto para crear/actualizar el código QR
  useEffect(() => {
    if (!qrCodeModule || !qrValue || !containerRef.current) return;
    
    const generateQR = async () => {
      try {
        // Limpiar el contenedor existente
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Crear un elemento canvas para el código QR
        const canvas = document.createElement('canvas');
        
        // Configuración del código QR
        const options = {
          width: 256,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'H' as const,
          scale: 4
        };

        // Generar el código QR
        await qrCodeModule.toCanvas(canvas, qrValue, options);
        
        // Agregar el canvas al contenedor
        if (containerRef.current) {
          containerRef.current.appendChild(canvas);
        }
      } catch (error) {
        console.error('Error al generar el QR:', error);
      }
    };
    
    generateQR();
  }, [qrCodeModule, qrValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQrValue(inputValue);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Generador de Código QR</h1>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label htmlFor="qr-content" className="block text-sm font-medium text-gray-700 mb-1">
              Contenido del Código QR
            </label>
            <div className="flex">
              <input
                type="text"
                id="qr-content"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresa una URL o texto"
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors"
              >
                Generar
              </button>
            </div>
          </div>
        </form>

        <div className="flex justify-center mb-6">
          <div ref={containerRef} className="border border-gray-300 p-4 rounded">
            {!qrCodeModule && (
              <p className="text-gray-500">Cargando generador de códigos QR...</p>
            )}
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 break-all">
            {qrValue.startsWith('http') ? (
              <span>Escanea para ir a: <span className="text-blue-500">{qrValue}</span></span>
            ) : (
              <span>Contenido: <span className="font-mono">{qrValue}</span></span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
