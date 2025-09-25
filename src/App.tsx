import React, { useEffect, useMemo, useRef, useState, lazy, Suspense, useCallback } from 'react';
import { ImageCropper } from './components/ImageCropper';
import { useQRHistory } from './hooks/useQRHistory';
import type { QRHistoryItem } from './hooks/useQRHistory';
import { QRPreview } from './components/QRPreview';
import {
  FiDownload,
  FiLink,
  FiFileText,
  FiUser,
  FiMail,
  FiWifi,
  FiPhone,
  FiBriefcase,
  FiAward,
  FiGlobe,
  FiHome,
  FiMessageSquare,
  FiMapPin,
  FiX,
  FiLock
} from 'react-icons/fi';

// Cargar componentes dinámicamente
const WiFiQR = lazy(() => import('./components/QRTypes/WiFiQR'));
const EmailQR = lazy(() => import('./components/QRTypes/EmailQR'));
const SMSQR = lazy(() => import('./components/QRTypes/SMSQR'));
const GeoQR = lazy(() => import('./components/QRTypes/GeoQR'));

type QRType = 'url' | 'text' | 'vcard' | 'wifi' | 'email' | 'sms' | 'geo';

interface QRAppearance {
  fgColor: string;
  bgColor: string;
  size: number;
  logoDataUrl?: string;
  dotType?: 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
  cornerSquareType?: 'square' | 'dot' | 'extra-rounded';
  cornerDotType?: 'square' | 'dot' | 'extra-rounded';
}

interface FormData {
  url: string;
  text: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  org: string;
  title: string;
  vurl: string;
  address: string;
  ssid: string;
  password: string;
  encryption: string;
  hidden: boolean;
  subject: string;
  body: string;
  message: string;
  latitude: string;
  longitude: string;
  altitude: string;
  locationTitle: string;
}

// Componente de límite de error para capturar errores en la renderización
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error en el componente:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 bg-red-100 text-red-800 rounded">
        <h2 className="font-bold">Algo salió mal.</h2>
        <p>Por favor, intenta recargar la página.</p>
      </div>;
    }

    return this.props.children;
  }
}

function buildVCard(data: FormData) {
  const {
    firstName = '',
    lastName = '',
    phone = '',
    email = '',
    org = '',
    title = '',
    vurl = '', // This is the URL field in FormData
    address = '',
  } = data;
  
  // Use vurl instead of url since that's the field name in FormData
  const url = vurl;
  
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${[firstName, lastName].filter(Boolean).join(' ')}`,
    org ? `ORG:${org}` : '',
    title ? `TITLE:${title}` : '',
    phone ? `TEL;TYPE=cell:${phone}` : '',
    email ? `EMAIL:${email}` : '',
    url ? `URL:${url}` : '',
    address ? `ADR;TYPE=home:;;${address};;;;` : '',
    'END:VCARD',
  ].filter(Boolean);
  
  return lines.join('\n');
}

function App() {
  // Estado para el tipo de QR actual
  const [type, setType] = useState<QRType>('url');
  
  // Estado para el modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Estado para el modal de recorte de imagen
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageForCrop, setImageForCrop] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState<FormData>({
    url: 'https://ejemplo.com',
    text: 'Texto de ejemplo',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+1234567890',
    email: 'juan@ejemplo.com',
    org: 'Empresa Ejemplo',
    title: 'Desarrollador',
    vurl: 'https://ejemplo.com',
    address: 'Calle Falsa 123',
    ssid: 'MiRedWiFi',
    password: 'micontraseña',
    encryption: 'WPA',
    hidden: false,
    subject: 'Asunto del correo',
    body: 'Cuerpo del mensaje',
    message: 'Mensaje de ejemplo',
    latitude: '40.7128',
    longitude: '-74.0060',
    altitude: '10',
    locationTitle: 'Nueva York'
  });

  // Estado para la apariencia del QR
  const [qrAppearance, setQrAppearance] = useState<QRAppearance>({
    fgColor: isDarkMode ? '#ffffff' : '#000000',
    bgColor: isDarkMode ? '#1f2937' : '#ffffff',
    size: 256,
    logoDataUrl: undefined,
    dotType: 'square',
    cornerSquareType: 'square',
    cornerDotType: 'square'
  });

  // Manejar cambios en la apariencia del QR
  const handleAppearanceChange = useCallback((updates: Partial<QRAppearance>) => {
    setQrAppearance(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const [showHistory, setShowHistory] = useState(false);
  const qrRef = useRef<any>(null);
  
  // Historial de códigos QR
  const { history, removeFromHistory, clearHistory } = useQRHistory();
  
  // Efecto para manejar el tema oscuro
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      setIsDarkMode(isDark);
      
      // Actualizar colores del QR según el tema
      setQrAppearance(prev => ({
        ...prev,
        fgColor: isDark ? '#ffffff' : '#000000',
        bgColor: isDark ? '#1f2937' : '#ffffff',
      }));
    }
  }, []);

  // Efecto para actualizar los colores del QR cuando cambia el tema
  useEffect(() => {
    setQrAppearance(prev => ({
      ...prev,
      fgColor: isDarkMode ? '#ffffff' : '#000000',
      bgColor: isDarkMode ? '#1f2937' : '#ffffff',
    }));
  }, [isDarkMode]);

  // Generar el valor del código QR según el tipo seleccionado
  const qrValue = useMemo(() => {
    switch (type) {
      case 'url':
        return formData.url || 'https://ejemplo.com';
      case 'text':
        return formData.text || 'Texto de ejemplo';
      case 'vcard':
        return buildVCard(formData);
      case 'wifi':
        return `WIFI:S:${formData.ssid};T:${formData.encryption};P:${formData.password};${formData.hidden ? 'H:true;' : ''};`;
      case 'email':
        return `mailto:${formData.email}?subject=${encodeURIComponent(formData.subject || '')}&body=${encodeURIComponent(formData.body || '')}`;
      case 'sms':
        return `sms:${formData.phone}?body=${encodeURIComponent(formData.message || '')}`;
      case 'geo':
        return `geo:${formData.latitude},${formData.longitude},${formData.altitude || 0}?q=${encodeURIComponent(formData.locationTitle || '')}`;
      default:
        return 'https://ejemplo.com';
    }
  }, [type, formData]);

  // Manejar cambio en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manejar cambio en  // Cargar un código QR del historial
  const loadFromHistory = useCallback((item: QRHistoryItem) => {
    setType(item.type as QRType);
    setFormData(item.data as unknown as FormData);
    setQrAppearance(prev => ({
      ...prev,
      ...item.appearance
    }));
    setShowHistory(false);
  }, [setType, setFormData, setQrAppearance, setShowHistory]);
  
  // Manejar el recorte de imagen completado
  const handleCropComplete = useCallback((croppedImage: string) => {
    setCroppedImage(croppedImage);
    setQrAppearance(prev => ({
      ...prev,
      logoDataUrl: croppedImage
    }));
    setCropModalOpen(false);
  }, [setQrAppearance]);
  
  // Formatear timestamp como cadena legible
  const formatTimestamp = useCallback((timestamp: number | string): string => {
    return new Date(Number(timestamp)).toLocaleString();
  }, []);

  // Manejar carga de logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      setImageForCrop(imageUrl);
      setCropModalOpen(true);
    };
    reader.onerror = () => {
      console.error('Error al leer el archivo');
    };
    reader.readAsDataURL(file);
  };

  // Manejar descarga del código QR
  const handleDownload = (format: 'png' | 'jpeg' | 'webp' | 'svg' = 'png') => {
    if (!qrRef.current) return;
    
    const fileName = `codigo-qr-${new Date().getTime()}.${format}`;
    
    if (format === 'svg') {
      qrRef.current.download({ name: fileName, extension: 'svg' });
    } else {
      qrRef.current.download({ name: fileName, extension: format });
    }
  };

  return (
    
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="max-w-7xl mx-auto">
        <header className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold">QR Code Generator</h1>
              <div className="text-sm bg-white/20 px-3 py-1 rounded-full">v1.0.0</div>
            </div>
            <p className="mt-2 text-blue-100">Create beautiful QR codes in seconds</p>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de configuración */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Configuración del Código QR</h2>
            
            {/* Selector de tipo de QR */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Código QR
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'url', icon: <FiLink className="mr-2" />, label: 'URL' },
                  { value: 'text', icon: <FiFileText className="mr-2" />, label: 'Texto' },
                  { value: 'vcard', icon: <FiUser className="mr-2" />, label: 'vCard' },
                  { value: 'wifi', icon: <FiWifi className="mr-2" />, label: 'WiFi' },
                  { value: 'email', icon: <FiMail className="mr-2" />, label: 'Email' },
                  { value: 'sms', icon: <FiMessageSquare className="mr-2" />, label: 'SMS' },
                  { value: 'geo', icon: <FiMapPin className="mr-2" />, label: 'Ubicación' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setType(item.value as QRType)}
                    className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium ${
                      type === item.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Formulario según el tipo de QR */}
            <div className="space-y-4">
              {type === 'url' && (
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://ejemplo.com"
                  />
                </div>
              )}
              {type === 'text' && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Text Content</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3">
                      <FiFileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      name="text"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                      rows={4}
                      placeholder="Enter your text here..."
                      value={formData.text}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
              {/* Formulario WiFi */}
              {type === 'wifi' && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">Configuración de Red WiFi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la red (SSID)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiWifi className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="ssid"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="MiRedWiFi"
                          value={formData.ssid || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="password"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="••••••••"
                          value={formData.password || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de seguridad</label>
                      <select
                        name="encryption"
                        className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.encryption || 'WPA'}
                        onChange={handleInputChange}
                      >
                        <option value="WPA">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="">Ninguna</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="hidden"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                          checked={formData.hidden || false}
                          onChange={(e) => setFormData({...formData, hidden: e.target.checked})}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Red oculta</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario Email */}
              {type === 'email' && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">Configuración de Email</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección de correo</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ejemplo@dominio.com"
                          value={formData.email || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asunto</label>
                      <input
                        type="text"
                        name="subject"
                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Asunto del correo"
                        value={formData.subject || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mensaje</label>
                      <textarea
                        name="body"
                        rows={4}
                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Escribe tu mensaje aquí..."
                        value={formData.body || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario SMS */}
              {type === 'sms' && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">Configuración de SMS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de teléfono</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+1234567890"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mensaje</label>
                      <div className="relative">
                        <div className="absolute top-3 left-3">
                          <FiMessageSquare className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          name="message"
                          rows={4}
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Escribe tu mensaje SMS aquí..."
                          value={formData.message || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario Ubicación */}
              {type === 'geo' && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">Configuración de Ubicación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitud</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.000001"
                          name="latitude"
                          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="40.7128"
                          value={formData.latitude || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitud</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.000001"
                          name="longitude"
                          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="-74.0060"
                          value={formData.longitude || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título de la ubicación</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="locationTitle"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Mi ubicación"
                          value={formData.locationTitle || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Altura (opcional)</label>
                      <div className="relative">
                        <input
                          type="number"
                          name="altitude"
                          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Altura en metros"
                          value={formData.altitude || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario vCard */}
              {type === 'vcard' && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                        name="firstName"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                          placeholder="john@example.com"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiBriefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                          placeholder="Company Name"
                          value={formData.org}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Job Title</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiAward className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                          placeholder="Job Title"
                          value={formData.title}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiGlobe className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                          placeholder="https://example.com"
                          value={formData.url}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <div className="relative">
                        <div className="absolute top-3 left-3">
                          <FiHome className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                          placeholder="123 Main St, City, Country"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración de apariencia */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Apariencia</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estilo de puntos */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estilo de puntos</label>
                    <select
                      className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={qrAppearance.dotType || 'square'}
                      onChange={(e) => setQrAppearance(prev => ({
                        ...prev,
                        dotType: e.target.value as 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded'
                      }))}
                    >
                      <option value="square">Cuadrados</option>
                      <option value="dots">Puntos</option>
                      <option value="rounded">Redondeados</option>
                      <option value="classy">Elegantes</option>
                      <option value="classy-rounded">Elegantes redondeados</option>
                      <option value="extra-rounded">Extra redondeados</option>
                    </select>
                  </div>

                  {/* Estilo de esquinas grandes */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estilo de esquinas</label>
                    <select
                      className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={qrAppearance.cornerSquareType || 'square'}
                      onChange={(e) => setQrAppearance(prev => ({
                        ...prev,
                        cornerSquareType: e.target.value as 'square' | 'dot' | 'extra-rounded'
                      }))}
                    >
                      <option value="square">Cuadradas</option>
                      <option value="dot">Puntos</option>
                      <option value="extra-rounded">Extra redondeadas</option>
                    </select>
                  </div>

                  {/* Estilo de esquinas pequeñas */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estilo de puntos de esquina</label>
                    <select
                      className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={qrAppearance.cornerDotType || 'square'}
                      onChange={(e) => setQrAppearance(prev => ({
                        ...prev,
                        cornerDotType: e.target.value as 'square' | 'dot' | 'extra-rounded'
                      }))}
                    >
                      <option value="square">Cuadrados</option>
                      <option value="dot">Puntos</option>
                      <option value="extra-rounded">Extra redondeados</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color de primer plano
                    </label>
                    <div className="flex items-center">
                      <input
                        type="color"
                        value={qrAppearance.fgColor}
                        onChange={(e) => handleAppearanceChange({ fgColor: e.target.value })}
                        className="h-10 w-10 rounded-md border border-gray-300 cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {qrAppearance.fgColor}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color de fondo
                    </label>
                    <div className="flex items-center">
                      <input
                        type="color"
                        value={qrAppearance.bgColor}
                        onChange={(e) => handleAppearanceChange({ bgColor: e.target.value })}
                        className="h-10 w-10 rounded-md border border-gray-300 cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {qrAppearance.bgColor}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tamaño (píxeles)
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="10"
                    value={qrAppearance.size}
                    onChange={(e) => handleAppearanceChange({ size: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>100px</span>
                    <span>{qrAppearance.size}px</span>
                    <span>1000px</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo (opcional)
                  </label>
                  <div className="flex items-center">
                    <label className="cursor-pointer bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Subir logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {qrAppearance.logoDataUrl && (
                      <button
                        type="button"
                        onClick={() => handleAppearanceChange({ logoDataUrl: undefined })}
                        className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                      >
                        Eliminar logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Panel de vista previa */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Vista Previa</h2>
              
              <div className="flex flex-col items-center">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 w-full max-w-xs flex items-center justify-center">
                  <QRPreview
                    value={qrValue}
                    fgColor={qrAppearance.fgColor}
                    bgColor={qrAppearance.bgColor}
                    size={qrAppearance.size}
                    logoDataUrl={qrAppearance.logoDataUrl}
                    dotType={qrAppearance.dotType}
                    cornerSquareType={qrAppearance.cornerSquareType}
                    cornerDotType={qrAppearance.cornerDotType}
                  />
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 break-all max-w-xs">
                    {qrValue.length > 50 ? `${qrValue.substring(0, 50)}...` : qrValue}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {qrValue.length} caracteres
                  </p>
                </div>
                
                <div className="mt-6 w-full">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Formato de descarga
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['PNG', 'JPEG', 'SVG', 'WebP'].map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => handleDownload(format.toLowerCase() as any)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiDownload className="mr-2 h-4 w-4" />
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Historial de códigos QR */}
            {history.length > 0 && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Historial</h3>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Limpiar
                  </button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="h-10 w-10 flex-shrink-0 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
                        {item.type === 'url' && <FiLink className="h-5 w-5 text-gray-500 dark:text-gray-300" />}
                        {item.type === 'text' && <FiFileText className="h-5 w-5 text-gray-500 dark:text-gray-300" />}
                        {item.type === 'vcard' && <FiUser className="h-5 w-5 text-gray-500 dark:text-gray-300" />}
                        {item.type === 'wifi' && <FiWifi className="h-5 w-5 text-gray-500 dark:text-gray-300" />}
                        {item.type === 'email' && <FiMail className="h-5 w-5 text-gray-500 dark:text-gray-300" />}
                        {item.type === 'sms' && <FiMessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-300" />}
                        {item.type === 'geo' && <FiMapPin className="h-5 w-5 text-gray-500 dark:text-gray-300" />}
                      </div>
                      <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.type.toUpperCase()} - {formatTimestamp(Number(item.timestamp))}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.data?.text || item.data?.url || item.data?.message || 'Sin descripción'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item.id);
                        }}
                        className="ml-auto text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de recorte de imagen */}
      {cropModalOpen && imageForCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recortar logo</h3>
              <button 
                onClick={() => setCropModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Cerrar"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="mb-4">
              <ImageCropper 
                imageUrl={imageForCrop}
                onCropComplete={handleCropComplete}
                onClose={() => setCropModalOpen(false)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setCropModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (croppedImage) {
                    setQrAppearance(prev => ({
                      ...prev,
                      logoDataUrl: croppedImage
                    }));
                  }
                  setCropModalOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!croppedImage}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Exportar el componente App envuelto en ErrorBoundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
