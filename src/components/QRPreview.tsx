import React, { useEffect, useRef } from 'react';

interface BorderProps {
  enabled: boolean;
  color: string;
  width: number;
  radius: number;
}

interface QRPreviewProps {
  value: string;
  fgColor: string;
  bgColor: string;
  size: number;
  logoDataUrl?: string;
  dotType?: 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
  cornerSquareType?: 'square' | 'dot' | 'extra-rounded';
  cornerDotType?: 'square' | 'dot' | 'extra-rounded';
  border?: BorderProps;
}

export const QRPreview: React.FC<QRPreviewProps> = ({
  value,
  fgColor,
  bgColor,
  size,
  logoDataUrl,
  dotType = 'square',
  cornerSquareType = 'square',
  cornerDotType = 'square',
  border = {
    enabled: false,
    color: '#000000',
    width: 10,
    radius: 0
  },
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<any>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;

    const loadQRCodeStyling = async () => {
      try {
        const QRCodeStyling = (await import('qr-code-styling')).default;
        // Calculate the QR code size based on border width
        const qrSize = border.enabled ? size - (border.width * 2) : size;
        const qrCode = new QRCodeStyling({
          width: qrSize,
          height: qrSize,
          data: value,
          margin: 1,
          qrOptions: {
            typeNumber: 0,
            mode: 'Byte',
            errorCorrectionLevel: 'H',
          },
          dotsOptions: {
            color: fgColor,
            type: dotType,
          },
          cornersSquareOptions: {
            color: fgColor,
            type: cornerSquareType,
          },
          cornersDotOptions: {
            color: fgColor,
            type: cornerDotType,
          },
          backgroundOptions: {
            color: bgColor,
          },
          image: logoDataUrl,
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          qrCode.append(containerRef.current);
        }

        qrRef.current = qrCode;
      } catch (error) {
        console.error('Error al cargar la biblioteca QR:', error);
      }
    };

    loadQRCodeStyling();
  }, [value, fgColor, bgColor, size, logoDataUrl, dotType, cornerSquareType, cornerDotType]);

  // Estilos para el contenedor principal que incluye el borde
  const containerStyle = {
    width: size,
    height: size,
    display: 'inline-block',
    position: 'relative' as const,
    boxSizing: 'border-box' as const,
    ...(border.enabled && {
      padding: border.width,
      backgroundColor: fgColor, // Color del borde
      borderRadius: border.radius > 0 ? `${border.radius}%` :
        (cornerSquareType === 'extra-rounded' || cornerDotType === 'extra-rounded' ? '8%' : '0'),
    }),
  };

  // Estilos para el contenedor interno del QR
  const qrContainerStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: bgColor,
    borderRadius: cornerSquareType === 'extra-rounded' || cornerDotType === 'extra-rounded' ? '8%' : '0',
  };

  return (
    <div style={containerStyle}>
      <div 
        ref={containerRef}
        style={qrContainerStyle}
      />
    </div>
  );
};
