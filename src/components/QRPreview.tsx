import React, { useEffect, useRef } from 'react';
// @ts-ignore - Import QRCodeStyling without type checking
import QRCodeStyling from 'qr-code-styling';

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
    color: fgColor,
    width: 10,
    radius: 0
  }
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      qrCodeRef.current = new QRCodeStyling({
        width: size,
        height: size,
        type: 'svg',
        data: value,
        image: logoDataUrl || '',
        margin: 0,
        qrOptions: {
          typeNumber: 0,
          mode: 'Byte',
          errorCorrectionLevel: 'Q',
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.4,
          margin: 0,
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
          color: 'transparent',
        },
      });

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        qrCodeRef.current.append(containerRef.current);
      }
    }

    return () => {
      if (qrCodeRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [value, fgColor, bgColor, size, dotType, cornerSquareType, cornerDotType, logoDataUrl]);

  const getBorderRadius = () => {
    if (border.radius > 0) return `${border.radius}%`;
    return cornerSquareType === 'extra-rounded' || cornerDotType === 'extra-rounded' ? '10%' : '0';
  };

  return (
    <div 
      className="relative inline-block transition-all duration-300"
      style={{
        padding: border?.enabled ? `${border.width}px` : '0.5em',
        backgroundColor: border?.enabled ? fgColor : 'transparent',
        borderRadius: getBorderRadius(),
      }}
    >
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center transition-all duration-300"
        style={{
          backgroundColor: bgColor,
          borderRadius: cornerSquareType === 'extra-rounded' || cornerDotType === 'extra-rounded' ? '10%' : '0',
          padding: '0.5em',
        }}
      />
    </div>
  );
};
