// apps/player-web/components/form-fields/PasswordInput.tsx
import React, { useState } from 'react';
import { FormInput } from './FormInput';
import { Eye, EyeOff } from 'lucide-react'; // Changed to Eye, EyeOff
import { RegisterOptions, FieldValues, FieldErrors } from 'react-hook-form'; // Import FieldErrors

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  rules?: RegisterOptions<FieldValues>;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errors?: FieldErrors<FieldValues>; // Refined type
  disabled?: boolean; // Add disabled prop
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { name, label, rules, containerClassName, labelClassName, inputClassName, errors, disabled, ...props },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <FormInput
        name={name}
        label={label}
        rules={rules}
        type={showPassword ? 'text' : 'password'}
        containerClassName={containerClassName}
        labelClassName={labelClassName}
        inputClassName={inputClassName}
        errors={errors}
        disabled={disabled} // Pass disabled prop
        ref={ref}
        suffix={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled} // Disable toggle button
            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 rounded-r-md transition-colors disabled:opacity-50"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
