import React from 'react';
import type { BaseQRTypeProps } from './BaseQRType';
import { BaseQRType } from './BaseQRType';

const SMSQR: React.FC<BaseQRTypeProps> = (props) => {
  return (
    <BaseQRType {...props}>
      <div>
        <label className="block text-sm font-medium mb-1">Número de teléfono</label>
        <input
          type="tel"
          name="phone"
          className="w-full border rounded px-3 py-2"
          placeholder="+1234567890"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Mensaje (opcional)</label>
        <textarea
          name="message"
          rows={3}
          className="w-full border rounded px-3 py-2"
          placeholder="Mensaje predeterminado"
        />
      </div>
    </BaseQRType>
  );
};

export default SMSQR;
