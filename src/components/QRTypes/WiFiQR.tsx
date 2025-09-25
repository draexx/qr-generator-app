import React from 'react';
import type { BaseQRTypeProps } from './BaseQRType';
import { BaseQRType } from './BaseQRType';

const WiFiQR: React.FC<BaseQRTypeProps> = (props) => {
  return (
    <BaseQRType {...props}>
      <div>
        <label className="block text-sm font-medium mb-1">SSID</label>
        <input
          type="text"
          name="ssid"
          className="w-full border rounded px-3 py-2"
          placeholder="Nombre de la red WiFi"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Contraseña</label>
        <input
          type="password"
          name="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Contraseña de la red"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Tipo de seguridad</label>
        <select
          name="encryption"
          className="w-full border rounded px-3 py-2"
          defaultValue="WPA"
        >
          <option value="nopass">Ninguna</option>
          <option value="WEP">WEP</option>
          <option value="WPA">WPA/WPA2</option>
        </select>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="hidden"
            className="rounded border-gray-300"
          />
          <span className="text-sm">Red oculta</span>
        </label>
      </div>
    </BaseQRType>
  );
};

export default WiFiQR;
