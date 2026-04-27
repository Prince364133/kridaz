// apps/player-web/components/form-fields/FormInput.tsx
import React from 'react';
import { FieldValues, useFormContext, RegisterOptions, FieldErrors } from 'react-hook-form'; // Import FieldErrors
import { Input } from '@/components/ui/input'; // Assuming this path
import { Label } from '@/components/ui/label'; // Assuming this path

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  rules?: RegisterOptions<FieldValues>;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errors?: FieldErrors<FieldValues>; // Refined type
  disabled?: boolean; // Add disabled prop
  suffix?: React.ReactNode;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    { name, label, rules, containerClassName, labelClassName, inputClassName, errors, disabled, suffix, ...props },
    ref
  ) => {
    const { register } = useFormContext();
    const { ref: registerRef, ...restRegister } = register(name, rules);

    const mergedRef = (e: HTMLInputElement | null) => {
      registerRef(e);
      if (typeof ref === 'function') {
        ref(e);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = e;
      }
    };

    const fieldError = errors?.[name];

    return (
      <div className={containerClassName}>
        {label && (
          <Label htmlFor={name} className={`${labelClassName} mb-2`}>
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            id={name}
            {...restRegister}
            {...props}
            ref={mergedRef}
            className={inputClassName}
            disabled={disabled} // Pass disabled prop
          />
          {suffix}
        </div>
        {fieldError && (
          <p className="text-sm font-medium text-destructive mt-1">
            {fieldError.message as React.ReactNode}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };
