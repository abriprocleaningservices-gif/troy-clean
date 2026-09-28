import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const fieldClasses =
  "w-full rounded-sm border border-pine-200 bg-white px-3.5 py-2.5 text-ink placeholder:text-ink/40 focus:border-pine-600 focus:outline-none focus:ring-1 focus:ring-pine-600";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps>(
  ({ label, error, hint, required, id, className = "", ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div>
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
          {label} {required && <span className="text-clay-500">*</span>}
        </label>
        <input id={inputId} ref={ref} className={`${fieldClasses} ${className}`} required={required} {...props} />
        {hint && !error && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
        {error && <p className="mt-1 text-xs text-clay-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapperProps
>(({ label, error, hint, required, id, className = "", ...props }, ref) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-clay-500">*</span>}
      </label>
      <textarea id={inputId} ref={ref} className={`${fieldClasses} min-h-[96px] ${className}`} required={required} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
      {error && <p className="mt-1 text-xs text-clay-600">{error}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldWrapperProps
>(({ label, error, hint, required, id, className = "", children, ...props }, ref) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-clay-500">*</span>}
      </label>
      <select id={inputId} ref={ref} className={`${fieldClasses} ${className}`} required={required} {...props}>
        {children}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
      {error && <p className="mt-1 text-xs text-clay-600">{error}</p>}
    </div>
  );
});
Select.displayName = "Select";
