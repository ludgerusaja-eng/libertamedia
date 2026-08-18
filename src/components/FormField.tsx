import React, { InputHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  helper?: string;
  as?: 'input' | 'textarea';
}

export const FormField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormFieldProps
>(({ label, error, helper, className = '', as = 'input', ...props }, ref) => {
  const Component = as as any;
  const hasError = !!error;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">
        {label}
        {props.required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <Component
        ref={ref}
        className={`w-full px-4 py-2 border rounded-lg font-sans text-sm transition-colors ${
          hasError
            ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
            : 'border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        } ${as === 'textarea' ? 'resize-none min-h-[120px]' : ''} ${className}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `error-${label}` : helper ? `helper-${label}` : undefined}
        {...props}
      />
      {error && (
        <div id={`error-${label}`} className="flex items-center gap-2 text-red-600 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      {helper && !error && (
        <p id={`helper-${label}`} className="text-xs text-slate-500">
          {helper}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';
