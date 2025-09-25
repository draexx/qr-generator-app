import React from 'react';
import type { BaseQRTypeProps } from './BaseQRType';
import { BaseQRType } from './BaseQRType';

const EmailQR: React.FC<BaseQRTypeProps> = (props) => {
  return (
    <BaseQRType {...props}>
      <div>
        <label className="block text-sm font-medium mb-1">Correo electrónico</label>
        <input
          type="email"
          name="email"
          className="w-full border rounded px-3 py-2"
          placeholder="email@ejemplo.com"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Asunto (opcional)</label>
        <input
          type="text"
          name="subject"
          className="w-full border rounded px-3 py-2"
          placeholder="Asunto del correo"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Mensaje (opcional)</label>
        <textarea
          name="body"
          rows={3}
          className="w-full border rounded px-3 py-2"
          placeholder="Cuerpo del mensaje"
        />
      </div>
    </BaseQRType>
  );
};

export default EmailQR;
