import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  FiLock,
  FiSun,
  FiMoon,
  FiEye,
  FiCode
} from 'react-icons/fi';

// Cargar componentes dinámicamente

type QRType = 'url' | 'text' | 'vcard' | 'wifi' | 'email' | 'sms' | 'geo';

interface QRAppearance {
  fgColor: string;
  bgColor: string;
  size: number;
  logoDataUrl?: string;
  dotType: 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
  cornerSquareType: 'square' | 'dot' | 'extra-rounded';
  cornerDotType: 'square' | 'dot' | 'extra-rounded';
  border: {
    enabled: boolean;
    color: string;
    width: number;
    radius: number;
  };
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
    vurl = '',
    address = '',
  } = data;

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

function AppModern() {
  // Estado para el tipo de QR actual
  const [type, setType] = useState<QRType>('url');

  // Estado para controlar si el panel de apariencia está abierto
  const [appearancePanelOpen, setAppearancePanelOpen] = useState(false);

  // Estado para el modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Estado para el menú móvil
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estado para el modal de recorte de imagen
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageForCrop, setImageForCrop] = useState<string | null>(null);

  // Estado para la apariencia del QR
  const [qrAppearance, setQrAppearance] = useState<QRAppearance>(() => ({
    fgColor: '#000000',
    bgColor: '#ffffff',
    size: 256,
    dotType: 'square',
    cornerSquareType: 'square',
    cornerDotType: 'square',
    border: {
      enabled: false,
      color: '#000000',
      width: 10,
      radius: 8
    }
  }));

  // Estado para los datos del formulario
  const [formData, setFormData] = useState<FormData>(() => ({
    url: 'https://ejemplo.com',
    text: 'Texto de ejemplo',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+1234567890',
    email: 'juan@ejemplo.com',
    org: 'Empresa S.A.',
    title: 'Desarrollador',
    vurl: 'https://ejemplo.com',
    address: 'Calle Falsa 123',
    ssid: 'MiRedWiFi',
    password: 'micontraseña',
    encryption: 'WPA',
    hidden: false,
    subject: 'Asunto del correo',
    body: 'Cuerpo del mensaje',
    message: 'Mensaje de texto',
    latitude: '40.7128',
    longitude: '-74.0060',
    altitude: '0',
    locationTitle: 'Nueva York'
  }));

  // Estado para el historial de códigos QR
  const { history, addToHistory, removeFromHistory, clearHistory } = useQRHistory();

  // Aplicar la clase dark al elemento html cuando cambie el modo oscuro
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      // Actualizar colores para modo oscuro
      setQrAppearance(prev => ({
        ...prev,
        fgColor: '#ffffff',
        bgColor: '#1f2937',
        border: {
          ...prev.border,
          color: '#ffffff'
        }
      }));
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      // Actualizar colores para modo claro
      setQrAppearance(prev => ({
        ...prev,
        fgColor: '#000000',
        bgColor: '#ffffff',
        border: {
          ...prev.border,
          color: '#000000'
        }
      }));
    }
  }, [isDarkMode]);

  // Función para alternar el modo oscuro
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode]);

  // Función para manejar cambios en los inputs del formulario
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  }, []);

  // Función para manejar cambios en la apariencia del QR
  const handleAppearanceChange = useCallback((updates: Partial<QRAppearance>) => {
    setQrAppearance(prev => ({
      ...prev,
      ...updates,
      border: updates.border ? { ...prev.border, ...updates.border } : prev.border
    }));
  }, []);

  // Función para manejar la subida de un logo
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageForCrop(event.target.result as string);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  }, []);

  // Función para manejar la descarga del código QR
  const handleDownload = useCallback((format: string) => {
    // Implementar lógica de descarga aquí
    console.log(`Descargando QR en formato ${format}`);
  }, []);

  // Función para formatear la fecha del historial
  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  // Obtener el valor del QR basado en el tipo seleccionado
  const qrValue = useMemo(() => {
    try {
      switch (type) {
        case 'url':
          return formData.url || 'https://ejemplo.com';
        case 'text':
          return formData.text || 'Texto de ejemplo';
        case 'wifi':
          return `WIFI:S:${formData.ssid || 'MiRedWiFi'};T:${formData.encryption || 'WPA'};P:${formData.password || ''}${formData.hidden ? ';H:true' : ''};`;
        case 'email':
          return `mailto:${formData.email || 'ejemplo@dominio.com'}?subject=${encodeURIComponent(formData.subject || '')}&body=${encodeURIComponent(formData.body || '')}`;
        case 'sms':
          return `sms:${formData.phone || ''}?body=${encodeURIComponent(formData.message || '')}`;
        case 'geo':
          return `geo:${formData.latitude || '0'},${formData.longitude || '0'}?q=${encodeURIComponent(formData.locationTitle || '')}`;
        case 'vcard':
          return buildVCard(formData);
        default:
          return 'Selecciona un tipo de código QR';
      }
    } catch (error) {
      console.error('Error generating QR value:', error);
      return 'Error al generar el código QR';
    }
  }, [type, formData]);

  // Efecto para agregar al historial cuando se genera un nuevo código QR
  const prevQrValueRef = useRef<string>('');

  useEffect(() => {
    // Solo agregar al historial si el valor del QR ha cambiado y es válido
    if (qrValue &&
        qrValue !== prevQrValueRef.current &&
        !qrValue.startsWith('Selecciona') &&
        !qrValue.startsWith('Error')) {

      addToHistory(
        type,
        { ...formData },
        qrAppearance,
        qrValue
      );

      // Actualizar la referencia con el valor actual
      prevQrValueRef.current = qrValue;
    }
  }, [qrValue, type, formData, qrAppearance, addToHistory]);

  // Función para cargar un código QR desde el historial
  const loadFromHistory = useCallback((item: QRHistoryItem) => {
    setType(item.type as QRType);
    setFormData(prev => ({
      ...prev,
      ...item.data
    }));
  }, []);

  // Función para manejar el recorte de la imagen
  const handleCropComplete = useCallback((croppedImageUrl: string) => {
    // Actualizar la apariencia del QR con la imagen recortada
    handleAppearanceChange({ logoDataUrl: croppedImageUrl });
    // Cerrar el modal después de aplicar el recorte
    setCropModalOpen(false);
  }, [handleAppearanceChange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                  <FiCode className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                  QR Generator
                </span>
              </div>
              <nav className="hidden md:ml-10 md:flex space-x-1">
                <button
                  onClick={() => setAppearancePanelOpen(!appearancePanelOpen)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    appearancePanelOpen
                      ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <FiEye className="inline mr-1.5 -mt-0.5" />
                  Apariencia
                </button>
              </nav>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors duration-200"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {isDarkMode ? (
                  <FiSun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <FiMoon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 focus:outline-none"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <FiX className="block h-5 w-5" />
                ) : (
                  <svg
                    className="block h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="pt-2 pb-3 space-y-1">
              <button
                onClick={() => {
                  setAppearancePanelOpen(!appearancePanelOpen);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-base font-medium ${
                  appearancePanelOpen
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <FiEye className="inline mr-2 -mt-0.5" />
                Apariencia
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - QR type selection and form */}
          <div className="lg:col-span-2 space-y-6">
            {/* QR type selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Tipo de Código QR</h2>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[
                  { type: 'url', icon: <FiLink className="h-5 w-5" />, label: 'URL' },
                  { type: 'text', icon: <FiFileText className="h-5 w-5" />, label: 'Texto' },
                  { type: 'vcard', icon: <FiUser className="h-5 w-5" />, label: 'vCard' },
                  { type: 'wifi', icon: <FiWifi className="h-5 w-5" />, label: 'WiFi' },
                  { type: 'email', icon: <FiMail className="h-5 w-5" />, label: 'Email' },
                  { type: 'sms', icon: <FiMessageSquare className="h-5 w-5" />, label: 'SMS' },
                  { type: 'geo', icon: <FiMapPin className="h-5 w-5" />, label: 'Ubicación' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setType(item.type as QRType)}
                    className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors ${
                      type === item.type
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {item.icon}
                    <span className="mt-1 text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form content based on selected type */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  {type === 'url' && 'URL'}
                  {type === 'text' && 'Texto'}
                  {type === 'vcard' && 'vCard'}
                  {type === 'wifi' && 'Configuración WiFi'}
                  {type === 'email' && 'Correo Electrónico'}
                  {type === 'sms' && 'Mensaje de Texto'}
                  {type === 'geo' && 'Ubicación'}
                </h2>
              </div>
              <div className="p-4">
                {type === 'url' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiGlobe className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          id="url"
                          name="url"
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://ejemplo.com"
                          value={formData.url}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {type === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Texto
                      </label>
                      <textarea
                        id="text"
                        name="text"
                        rows={4}
                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Escribe tu texto aquí..."
                        value={formData.text}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Add other form types here */}
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
                
                {/* Botón de generar QR */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Generar Código QR
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar - QR preview and download options */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Vista Previa</h2>
              </div>
              <div className="p-4">
                <div className="flex flex-col items-center">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 w-full max-w-xs flex items-center justify-center">
                    <QRPreview
                      value={qrValue}
                      fgColor={qrAppearance.fgColor}
                      bgColor={qrAppearance.bgColor}
                      size={200}
                      logoDataUrl={qrAppearance.logoDataUrl}
                      dotType={qrAppearance.dotType}
                      cornerSquareType={qrAppearance.cornerSquareType}
                      cornerDotType={qrAppearance.cornerDotType}
                      border={qrAppearance.border}
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
                          onClick={() => handleDownload(format.toLowerCase())}
                          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiDownload className="mr-2 h-4 w-4" />
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 w-full">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Usa el botón <strong>Apariencia</strong> en la barra superior para personalizar el código QR.
                    </p>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* History section */}
            {history.length > 0 && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Historial</h3>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="p-2">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
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
                            {String(item.type || '').toUpperCase()} - {formatTimestamp(Number(item.timestamp))}
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
              </div>
            )}
          </div>

      </main>

      {/* Panel de personalización de apariencia */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-40 ${
        appearancePanelOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Personalizar apariencia</h2>
            <button
              onClick={() => setAppearancePanelOpen(false)}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color del código</h3>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Color</label>
                  <input
                    type="color"
                    value={qrAppearance.fgColor}
                    onChange={(e) => handleAppearanceChange({ fgColor: e.target.value })}
                    className="h-8 w-8 rounded border border-gray-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fondo</label>
                  <input
                    type="color"
                    value={qrAppearance.bgColor}
                    onChange={(e) => handleAppearanceChange({ bgColor: e.target.value })}
                    className="h-8 w-8 rounded border border-gray-300"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tamaño</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="10"
                  value={qrAppearance.size}
                  onChange={(e) => handleAppearanceChange({ size: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                  {qrAppearance.size}px
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estilo de puntos</h3>
              <div className="grid grid-cols-3 gap-2">
                {['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleAppearanceChange({ dotType: style as any })}
                    className={`p-2 text-xs rounded border ${
                      qrAppearance.dotType === style
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</h3>
              <div className="mt-1 flex items-center">
                <label className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Seleccionar imagen
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
                    onClick={() => handleAppearanceChange({ logoDataUrl: '' })}
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

      {/* Image Cropper Modal */}
      {cropModalOpen && imageForCrop && (
        <div className="fixed inset-0 z-50 overflow-y-auto dark:bg-gray-900">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-90"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    Recortar imagenaaaaa
                  </h3>
                  <div className="mt-2">
                    <ImageCropper 
                      imageUrl={imageForCrop}
                      onCropComplete={handleCropComplete}
                      onClose={() => setCropModalOpen(false)}
                      aspect={1}
                    />
                  </div>
                </div>
              </div>
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
    <AppModern />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
