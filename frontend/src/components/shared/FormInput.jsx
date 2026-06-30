import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormInput = ({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  readOnly,
  name,
  className = '',
  as,          // 'textarea' to render a <textarea>
  rows = 3,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const sharedClass = `
    w-full bg-cz-dark-bg text-white border rounded-lg outline-none transition-all
    ${error
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
      : 'border-cz-border focus:border-cz-accent-orange focus:ring-2 focus:ring-cz-accent-orange/50'}
    ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}
  `;

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="text-cz-text-secondary text-sm font-medium mb-1.5">
          {label}
        </label>
      )}

      <div className="relative flex items-start">
        {as === 'textarea' ? (
          <textarea
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            rows={rows}
            className={`${sharedClass} px-4 py-2 resize-none`}
          />
        ) : (
          <input
            type={inputType}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            className={`${sharedClass} pl-4 ${isPassword ? 'pr-10' : 'pr-4'} py-2`}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-cz-text-secondary hover:text-white transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <span className="text-red-500 text-xs mt-1">{error}</span>
      )}
    </div>
  );
};

export default FormInput;
