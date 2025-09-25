import React from 'react';

export type QRType = 'url' | 'text' | 'vcard' | 'wifi' | 'email' | 'sms' | 'geo';

export interface BaseQRTypeProps {
  onChange: (data: Record<string, any>) => void;
  values: Record<string, any>;
  onValidate?: (isValid: boolean) => void;
  children?: React.ReactNode;
}

export const BaseQRType: React.FC<BaseQRTypeProps> = ({ 
  children,
  onChange,
  values
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    onChange({
      ...values,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="space-y-4">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = {
            onChange: handleChange,
            value: values[child.props.name] ?? '',
            ...child.props
          };
          return React.cloneElement(child, childProps);
        }
        return child;
      })}
    </div>
  );
};

export default BaseQRType;
