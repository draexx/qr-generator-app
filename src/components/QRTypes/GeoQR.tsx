import React from 'react';
import type { BaseQRTypeProps } from './BaseQRType';
import { BaseQRType } from './BaseQRType';

const GeoQR: React.FC<BaseQRTypeProps> = (props) => {
  return (
    <BaseQRType {...props}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Latitud</label>
          <input
            type="number"
            step="any"
            name="latitude"
            className="w-full border rounded px-3 py-2"
            placeholder="40.7128"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Longitud</label>
          <input
            type="number"
            step="any"
            name="longitude"
            className="w-full border rounded px-3 py-2"
            placeholder="-74.0060"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Altitud (opcional)</label>
        <input
          type="number"
          name="altitude"
          className="w-full border rounded px-3 py-2"
          placeholder="Altura en metros"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Título (opcional)</label>
        <input
          type="text"
          name="title"
          className="w-full border rounded px-3 py-2"
          placeholder="Ubicación especial"
        />
      </div>
    </BaseQRType>
  );
};

export default GeoQR;
