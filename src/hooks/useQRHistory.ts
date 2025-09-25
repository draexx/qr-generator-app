import { useState, useEffect } from 'react';

export type QRType = 'url' | 'text' | 'vcard' | 'wifi' | 'email' | 'sms' | 'geo';

export interface QRAppearance {
  fgColor: string;
  bgColor: string;
  size: number;
  logoDataUrl?: string;
  dotType?: 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
  cornerSquareType?: 'square' | 'dot' | 'extra-rounded';
  cornerDotType?: 'square' | 'dot' | 'extra-rounded';
}

export interface QRHistoryItem {
  id: string;
  type: QRType;
  data: Record<string, any>;
  timestamp: number;
  preview?: string;
  appearance: QRAppearance;
}

export function useQRHistory() {
  const [history, setHistory] = useState<QRHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar historial desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('qrHistory');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error al cargar el historial:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Guardar en localStorage cuando cambie el historial
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('qrHistory', JSON.stringify(history));
    }
  }, [history, isLoaded]);

  const addToHistory = (type: QRType, data: Record<string, any>, appearance: QRAppearance, preview?: string) => {
    const newItem: QRHistoryItem = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: Date.now(),
preview: preview || '',
      appearance
    };
    
    setHistory(prev => [newItem, ...prev].slice(0, 100)); // Limitar a 100 entradas
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    isLoaded
  };
}
