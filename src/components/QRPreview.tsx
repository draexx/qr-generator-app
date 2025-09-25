import React, { useEffect, useRef } from 'react';

interface QRPreviewProps {
  value: string;
  fgColor: string;
  bgColor: string;
  size: number;
  logoDataUrl?: string;
  dotType?: 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
  cornerSquareType?: 'square' | 'dot' | 'extra-rounded';
  cornerDotType?: 'square' | 'dot' | 'extra-rounded';
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<any>(null);

  useEffect(() => {
    if (!value) return;

    const loadQRCodeStyling = async () => {
      try {
        const QRCodeStyling = (await import('qr-code-styling')).default;
        
        qrRef.current = new QRCodeStyling({
          width: size,
          height: size,
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
          dotsOptionsHelper: {
            colorType: {
              single: true,
              gradient: false,
            },
            gradient: {
              linear: true,
              radial: false,
              color1: '#000000',
              color2: '#000000',
              rotation: '0',
            },
          },
          cornersSquareOptionsHelper: {
            colorType: {
              single: true,
              gradient: false,
            },
            gradient: {
              linear: true,
              radial: false,
              color1: '#000000',
              color2: '#000000',
              rotation: '0',
            },
          },
          cornersDotOptionsHelper: {
            colorType: {
              single: true,
              gradient: false,
            },
            gradient: {
              linear: true,
              radial: false,
              color1: '#000000',
              color2: '#000000',
              rotation: '0',
            },
          },
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          qrRef.current.append(containerRef.current);
        }
      } catch (error) {
        console.error('Error al cargar la biblioteca QR:', error);
      }
    };

    loadQRCodeStyling();
  }, [value, fgColor, bgColor, size, logoDataUrl, dotType, cornerSquareType, cornerDotType]);

  return <div ref={containerRef} className="qr-code" />;
};
