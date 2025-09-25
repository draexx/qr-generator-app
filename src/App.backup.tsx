import React, { useEffect, useMemo, useRef, useState, lazy, Suspense, useCallback } from 'react';
import { ImageCropper } from './components/ImageCropper';
import { useQRHistory } from './hooks/useQRHistory';
import {
  FiDownload,
  FiLink,
  FiFileText,
  FiUser,
  FiPhone,
  FiMail,
  FiBriefcase,
  FiAward,
  FiHome,
  FiGlobe,
  FiImage
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
  // Estilo de los puntos
  dotType?: 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
  // Estilo de las esquinas grandes
  cornerSquareType?: 'square' | 'dot' | 'extra-rounded';
  // Estilo de las esquinas pequeñas
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

function buildVCard(data: Record<string, string>) {
  const {
    firstName = '',
    lastName = '',
    phone = '',
    email = '',
    org = '',
    title = '',
    url = '',
    address = '',
  } = data
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
  ].filter(Boolean)
  return lines.join('\n')
}

function App() {
  // Estado para el tipo de QR actual
  const [type, setType] = useState<QRType>('url');
  
  // Clase de Tailwind para verificar que los estilos se estén aplicando
  const containerClass = "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6";

  // Estado para los datos del formulario
  const [formData, setFormData] = useState<FormData>({
    url: '',
    text: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    org: '',
    title: '',
    vurl: '',
    address: '',
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
    subject: '',
    body: '',
    message: '',
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Estado para la apariencia del QR
  const [qrAppearance, setQrAppearance] = useState<QRAppearance>({
    fgColor: isDarkMode ? '#ffffff' : '#000000',
    bgColor: isDarkMode ? '#1f2937' : '#ffffff',
    size: 256,
    logoDataUrl: undefined,
    // Valores por defecto para los estilos
    dotType: 'square',
    cornerSquareType: 'square',
    cornerDotType: 'square'
  });
  const [showHistory, setShowHistory] = useState(false);

  // Referencias
  const containerRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<any>(null);
  const [QrLib, setQrLib] = useState<{ QRCodeStyling: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Historial de códigos QR
  const { history, addToHistory, removeFromHistory, clearHistory } = useQRHistory();
  
  // Cargar la librería dinámicamente (compatible con Vite)
  useEffect(() => {
    let mounted = true;
    
    const loadQrLibrary = async () => {
      try {
        setLoading(true);
        const QRCodeStyling = (await import('qr-code-styling')).default;
        if (mounted) {
          setQrLib({ QRCodeStyling });
        }
      } catch (e) {
        console.error('Error loading QR library:', e);
        setError('Failed to load QR code library. Please try again.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    loadQrLibrary();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Generate the appropriate value based on the selected QR type
const value = useMemo(() => {
  switch (type) {
    case 'url':
      return formData.url || '';
    case 'text':
      return formData.text || '';
    case 'vcard':
      return buildVCard({
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        phone: formData.phone || '',
        email: formData.email || '',
        org: formData.org || '',
        title: formData.title || '',
        url: formData.vurl || '',
        address: formData.address || ''
      });
    case 'wifi':
      return `WIFI:S:${formData.ssid || ''};T:${formData.encryption || 'WPA'};P:${formData.password || ''};${formData.hidden ? 'H:true;' : ''}`;
    case 'email': {
      const emailParams = new URLSearchParams();
      if (formData.subject) emailParams.append('subject', formData.subject);
      if (formData.body) emailParams.append('body', formData.body);
      return `mailto:${formData.email || ''}${emailParams.toString() ? '?' + emailParams.toString() : ''}`;
    }
    case 'sms':
      return `SMSTO:${formData.phone || ''}:${formData.message || ''}`;
    case 'geo':
      return `geo:${formData.latitude},${formData.longitude}${formData.altitude ? `,${formData.altitude}` : ''}${formData.locationTitle ? `?q=${encodeURIComponent(formData.locationTitle)}` : ''}`;
    default:
      return '';
  }
}, [type, formData]);

  // Efecto para crear/actualizar el código QR cuando cambian los datos
  useEffect(() => {
    if (!QrLib || !value || !containerRef.current) return;
    
    try {
      const qrCode = new QrLib.QRCodeStyling({
        width: qrAppearance.size,
        height: qrAppearance.size,
        data: value,
        image: qrAppearance.logoDataUrl,
        dotsOptions: {
          color: qrAppearance.fgColor,
          type: 'square',
        },
        cornersSquareOptions: {
          type: 'square',
          color: qrAppearance.fgColor,
        },
        cornersDotOptions: {
          type: 'square',
          color: qrAppearance.fgColor,
        },
        backgroundOptions: {
          color: qrAppearance.bgColor,
        },
      });
      
      qrCode.append(containerRef.current);
      qrRef.current = qrCode;
      
      return () => {
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    } catch (e) {
      console.error('Error creating/updating QR:', e);
      setError('Error generating QR code. Please try again.');
    }
  }, [QrLib, value, qrAppearance]);

  // Manejador de cambios en los inputs
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  }, []);

  // Manejador para cambio de tipo de QR
  const handleTypeChange = useCallback((newType: QRType) => {
    setType(newType);
  }, []);

  // Función para procesar la imagen y hacerla cuadrada
  const processImage = (imageDataUrl: string, removeBg: boolean = false): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        
        // Calcular las coordenadas para recortar el centro de la imagen
        const sourceAspectRatio = img.width / img.height;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        
        // Si la imagen es más ancha que alta, recortar los lados
        if (sourceAspectRatio > 1) {
          sourceX = (img.width - img.height) / 2;
          sourceWidth = img.height;
        } 
        // Si la imagen es más alta que ancha, recortar la parte superior e inferior
        else if (sourceAspectRatio < 1) {
          sourceY = (img.height - img.width) / 2;
          sourceHeight = img.width;
        }
        
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageDataUrl);
        
        // Si se solicita quitar el fondo, dibujamos un fondo blanco primero
        if (removeBg) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
        }
        
        // Dibujamos la imagen recortada del centro
        ctx.drawImage(
          img,
          sourceX,      // x de inicio en la imagen fuente
          sourceY,      // y de inicio en la imagen fuente
          sourceWidth,  // ancho a copiar de la imagen fuente
          sourceHeight, // alto a copiar de la imagen fuente
          0,            // x de inicio en el canvas
          0,            // y de inicio en el canvas
          size,         // ancho en el canvas
          size          // alto en el canvas
        );
        
        // Convertimos a formato base64
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => resolve(imageDataUrl);
      img.src = imageDataUrl;
    });
  };

  // Manejador para cuando se completa el recorte
  const handleCropComplete = (croppedImageUrl: string) => {
    if (croppedImageUrl) {
      if (removeBg) {
        // Si se solicitó quitar el fondo, aplicamos el procesamiento adicional
        processImage(croppedImageUrl, true).then(processedImage => {
          setQrAppearance(prev => ({ ...prev, logoDataUrl: processedImage }));
        });
      } else {
        setQrAppearance(prev => ({ ...prev, logoDataUrl: croppedImageUrl }));
      }
    }
    setCropModalOpen(false);
    setImageForCrop(null);
    setTempImage(null);
  };

  // Manejador para subir logo
  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, removeBg: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) {
      setQrAppearance(prev => ({ ...prev, logoDataUrl: undefined }));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string;
      setRemoveBg(removeBg);
      setTempImage(imageDataUrl);
      setImageForCrop(imageDataUrl);
      setCropModalOpen(true);
    };
    
    reader.onerror = () => {
      console.error('Error al leer el archivo');
    };
    
    reader.readAsDataURL(file);
  }, []);
  
  // Limpiar el input de archivo después de usarlo
  const clearFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = '';
  };

  // Actualizar los colores cuando se cambia el modo oscuro
  useEffect(() => {
    if (isDarkMode) {
      setQrAppearance(prev => ({
        ...prev,
        fgColor: '#ffffff',
        bgColor: '#1f2937'
      }));
    } else {
      setQrAppearance(prev => ({
        ...prev,
        fgColor: '#111827',
        bgColor: '#ffffff'
      }));
    }
  }, [isDarkMode]);
  
  // Efecto para aplicar el tema oscuro/claro al documento
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Cargar la librería dinámicamente (compatible con Vite)
  useEffect(() => {
    let mounted = true
    setLoading(true)
    
    // Función para manejar la importación dinámica
    const loadQrLibrary = async () => {
      try {
        // Usamos import() para cargar dinámicamente el módulo
        const module = await import('qr-code-styling')
        
        if (!mounted) return
        
        // Verificamos diferentes formatos de exportación del módulo
        if (module.QRCodeStyling) {
          setQrLib({ QRCodeStyling: module.QRCodeStyling })
        } else if (module.default) {
          // Si el módulo usa export default
          if (module.default.QRCodeStyling) {
            setQrLib(module.default)
          } else {
            // Si el default export es directamente el constructor
            setQrLib({ QRCodeStyling: module.default })
          }
        } else if (module) {
          // Último intento, asumir que el módulo es el constructor
          setQrLib({ QRCodeStyling: module })
        } else {
          throw new Error('Formato de módulo no reconocido')
        }
        
        setError(null)
      } catch (e) {
        console.error('Error cargando qr-code-styling:', e)
        if (mounted) {
          setError('No se pudo cargar la biblioteca QR. Por favor, recarga la página.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    loadQrLibrary()
    
    return () => {
      mounted = false
    }
  }, [])

  // Crear o actualizar el QR cuando cambian las opciones o la librería
  useEffect(() => {
    if (!QrLib || !containerRef.current || error) {
      return
    }
    
    try {
      const options = {
        width: qrAppearance.size,
        height: qrAppearance.size,
        data: value || ' ',
        image: qrAppearance.logoDataUrl || undefined,
        dotsOptions: { 
          color: qrAppearance.fgColor, 
          type: qrAppearance.dotType || 'square' 
        },
        cornersSquareOptions: { 
          type: qrAppearance.cornerSquareType || 'square', 
          color: qrAppearance.fgColor 
        },
        cornersDotOptions: { 
          type: qrAppearance.cornerDotType || 'square', 
          color: qrAppearance.fgColor 
        },
        backgroundOptions: { 
          color: qrAppearance.bgColor 
        },
        qrOptions: {
          typeNumber: 0,
          mode: 'Byte',
          errorCorrectionLevel: 'H'
        }
      }

      // Limpiar el contenedor antes de crear un nuevo QR
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }

      // Asegurarnos de que el contenedor esté montado y la librería esté lista
      if (containerRef.current && QrLib.QRCodeStyling) {
        // Crear una nueva instancia del QR
        const qrCode = new QrLib.QRCodeStyling(options)
        qrRef.current = qrCode
        
        // Renderizar el QR en el contenedor
        qrCode.append(containerRef.current)
        
        // Limpiar el error si todo salió bien
        setError(null)
      }
    } catch (e) {
      console.error('Error creando/actualizando QR:', e)
      setError('Error al generar el código QR. Intenta recargar la página.')
    }
  }, [QrLib, value, qrAppearance, error])


  return (
    <div className={containerClass}>
      {/* Modal de recorte de imagen */}
      {cropModalOpen && tempImage && (
        <ImageCropper
          imageUrl={tempImage}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setCropModalOpen(false);
            setImageForCrop(null);
            setTempImage(null);
          }}
          aspect={1} // Forzamos relación de aspecto 1:1 (cuadrada)
        />
      )}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold">QR Code Generator</h1>
            <div className="text-sm bg-white/20 px-3 py-1 rounded-full">v1.0.0</div>
          </div>
          <p className="mt-2 text-blue-100">Create beautiful QR codes in seconds</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Content Settings</h2>
              <p className="text-gray-600">Choose the type of content you want to encode in the QR code</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Content Type</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLink className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="url">Website URL</option>
                  <option value="text">Plain Text</option>
                  <option value="vcard">Contact (vCard)</option>
                </select>
              </div>
            </div>

            {type === 'url' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Website URL</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiGlobe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    name="url"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={handleInputChange}
                  />
                </div>
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                    rows={4}
                    placeholder="Enter your text here..."
                    value={formData.text}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {type === 'vcard' && (
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-700">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                      name="firstName"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
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
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
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
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
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
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
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
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
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
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
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
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
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
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
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

            <div className="pt-4 mt-6 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-700 mb-4">Customize QR Code</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Dots Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      className="h-10 w-16 rounded-lg border-2 border-gray-200 cursor-pointer"
                      value={qrAppearance.fgColor}
                      onChange={(e) => setQrAppearance(prev => ({ ...prev, fgColor: e.target.value }))}
                    />
                    <span className="text-sm text-gray-500">{qrAppearance.fgColor}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Background Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      className="h-10 w-16 rounded-lg border-2 border-gray-200 cursor-pointer"
                      value={qrAppearance.bgColor}
                      onChange={(e) => setQrAppearance(prev => ({ ...prev, bgColor: e.target.value }))}
                    />
                    <span className="text-sm text-gray-500">{qrAppearance.bgColor}</span>
                  </div>
                </div>
                
                {/* Estilo de los puntos */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Dot Style</label>
                  <select
                    className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={qrAppearance.dotType}
                    onChange={(e) => setQrAppearance(prev => ({ ...prev, dotType: e.target.value as any }))}
                  >
                    <option value="square">Square</option>
                    <option value="dots">Dots</option>
                    <option value="rounded">Rounded</option>
                    <option value="classy">Classy</option>
                    <option value="classy-rounded">Classy Rounded</option>
                    <option value="extra-rounded">Extra Rounded</option>
                  </select>
                </div>

                {/* Estilo de las esquinas grandes */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Corner Square Style</label>
                  <select
                    className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={qrAppearance.cornerSquareType}
                    onChange={(e) => setQrAppearance(prev => ({ ...prev, cornerSquareType: e.target.value as any }))}
                  >
                    <option value="square">Square</option>
                    <option value="dot">Dot</option>
                    <option value="extra-rounded">Extra Rounded</option>
                  </select>
                </div>

                {/* Estilo de las esquinas pequeñas */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Corner Dot Style</label>
                  <select
                    className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={qrAppearance.cornerDotType}
                    onChange={(e) => setQrAppearance(prev => ({ ...prev, cornerDotType: e.target.value as any }))}
                  >
                    <option value="square">Square</option>
                    <option value="dot">Dot</option>
                    <option value="extra-rounded">Extra Rounded</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Size: {qrAppearance.size}px</label>
                    <span className="text-xs text-gray-500">{qrAppearance.size} × {qrAppearance.size}px</span>
                  </div>
                  <input
                    type="range"
                    min={128}
                    max={512}
                    step={16}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    value={qrAppearance.size}
                    onChange={(e) => setQrAppearance(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Small</span>
                    <span>Large</span>
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Logo (Optional)</label>
                  <div className="mt-1 flex items-center">
                    <label className="group relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150 ease-in-out">
                      <div className="flex items-center space-x-2">
                        <FiImage className="h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Choose an image</span>
                      </div>
                      <input 
                        type="file" 
                        className="sr-only" 
                        accept="image/*" 
                        onChange={(e) => {
                          handleLogoUpload(e, false);
                          clearFileInput(e);
                        }}
                      />
                    </label>
                    <label className="group relative cursor-pointer bg-white py-2 px-3 ml-2 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150 ease-in-out">
                      <div className="flex items-center space-x-2">
                        <FiImage className="h-5 w-5 text-blue-400 group-hover:text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">Upload & Remove BG</span>
                      </div>
                      <input 
                        type="file" 
                        className="sr-only" 
                        accept="image/*" 
                        onChange={(e) => {
                          handleLogoUpload(e, true);
                          clearFileInput(e);
                        }}
                      />
                    </label>
                    {qrAppearance.logoDataUrl && (
                      <button 
                        type="button"
                        onClick={() => setQrAppearance(prev => ({ ...prev, logoDataUrl: undefined }))}
                        className="ml-3 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="flex items-center h-5">
                      <input
                        id="crop-to-square"
                        name="crop-to-square"
                        type="checkbox"
                        checked={true}
                        disabled
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-2">
                      <label htmlFor="crop-to-square" className="text-xs text-gray-500">
                        Automatically crop to square
                      </label>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Add a logo to the center of your QR code (max 30% of QR size). Use "Remove BG" for transparent images.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-1">
            <div className="sticky top-8 bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center space-y-6">
              <div className="w-full text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">QR Code Preview</h2>
                <p className="text-sm text-gray-500">Scan the code to test it</p>
              </div>
              
              <div className="relative w-full max-w-xs aspect-square bg-white p-4 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                {loading ? (
                  <div className="space-y-4 text-center">
                    <div className="animate-pulse flex flex-col items-center space-y-3">
                      <div className="h-40 w-40 bg-gray-200 rounded-lg"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <p className="text-sm text-gray-500">Loading QR code library...</p>
                  </div>
                ) : error ? (
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Error generating QR code</h3>
                    <p className="mt-1 text-sm text-gray-500">{error}. Please check the console for details.</p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Reload Page
                    </button>
                  </div>
                ) : (
                  <>
                    <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
                    {!value && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded">
                        <div className="text-center p-4">
                          <FiImage className="mx-auto h-12 w-12 text-gray-300" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No content</h3>
                          <p className="mt-1 text-sm text-gray-500">Enter content to generate QR code</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {!loading && !error && value && (
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                      onClick={() => qrRef.current?.download({ name: 'qr-code', extension: 'png' })}
                    >
                      <FiDownload className="-ml-1 mr-2 h-4 w-4" />
                      Download PNG
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                      onClick={() => qrRef.current?.download({ name: 'qr-code', extension: 'svg' })}
                    >
                      <FiDownload className="-ml-1 mr-2 h-4 w-4" />
                      Download SVG
                    </button>
                  </div>
                  <p className="text-xs text-center text-gray-500">QR code updates in real-time</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

// Envolvemos el componente App con el ErrorBoundary
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}