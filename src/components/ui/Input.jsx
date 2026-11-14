import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatThousandInput, parseThousandInput } from '../../utils/formatters';

function isStepDecimal(step) {
  if (step === undefined || step === null || step === '' || step === 'any') return false;
  const num = Number(step);
  return Number.isFinite(num) && num > 0 && num < 1;
}

function getCursorIndex(formatted, significantCount, allowDecimal) {
  if (significantCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    const ch = formatted[i];
    const isMatch = allowDecimal ? /[\d,]/.test(ch) : /\d/.test(ch);
    if (isMatch) {
      seen += 1;
      if (seen === significantCount) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}

/**
 * Input angka dengan titik pemisah ribuan otomatis (contoh: 385000 -> "385.000").
 * Meneruskan string angka bersih ke onChange({ target: { value, name, id } }).
 */
export function NumberInput({
  value,
  onChange,
  onFocus,
  onBlur,
  allowDecimal,
  step,
  min: _min,
  max: _max,
  type: _type,
  name,
  id,
  className = '',
  ...props
}) {
  const isDecimal = allowDecimal ?? isStepDecimal(step);
  const inputRef = useRef(null);
  const isFocusedRef = useRef(false);
  const cursorPosRef = useRef(null);

  const [displayValue, setDisplayValue] = useState(() =>
    formatThousandInput(value, isDecimal)
  );

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDisplayValue(formatThousandInput(value, isDecimal));
    }
  }, [value, isDecimal]);

  useLayoutEffect(() => {
    if (
      cursorPosRef.current !== null &&
      inputRef.current &&
      document.activeElement === inputRef.current
    ) {
      const pos = cursorPosRef.current;
      cursorPosRef.current = null;
      inputRef.current.setSelectionRange(pos, pos);
    }
  }, [displayValue]);

  const handleChange = (e) => {
    const raw = e.target.value;
    const selStart = e.target.selectionStart ?? raw.length;
    const rawBefore = raw.slice(0, selStart);

    const parsed = parseThousandInput(raw, isDecimal);
    const formatted = formatThousandInput(parsed, isDecimal);

    let countBefore = (rawBefore.match(isDecimal ? /[\d,]/g : /\d/g) || []).length;
    if (isDecimal && formatted.startsWith('0,') && !raw.trim().startsWith('0')) {
      countBefore += 1;
    }
    cursorPosRef.current = getCursorIndex(formatted, countBefore, isDecimal);

    setDisplayValue(formatted);
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          value: parsed,
          name,
          id,
        },
        currentTarget: {
          ...e.currentTarget,
          value: parsed,
          name,
          id,
        },
      });
    }
  };

  const handleFocus = (e) => {
    isFocusedRef.current = true;
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    isFocusedRef.current = false;
    if (displayValue.endsWith(',')) {
      const cleaned = parseThousandInput(displayValue.slice(0, -1), isDecimal);
      if (onChange) {
        onChange({
          ...e,
          target: { ...e.target, value: cleaned, name, id },
          currentTarget: { ...e.currentTarget, value: cleaned, name, id },
        });
      }
      setDisplayValue(formatThousandInput(cleaned, isDecimal));
    } else {
      setDisplayValue(formatThousandInput(value, isDecimal));
    }
    if (onBlur) onBlur(e);
  };

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="text"
      inputMode={isDecimal ? 'decimal' : 'numeric'}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  );
}

export function Input({
  id,
  label,
  helperText,
  error,
  prefix,
  suffix,
  className = '',
  inputClassName = '',
  type,
  allowDecimal,
  ...props
}) {
  const isNumberType = type === 'number';
  const baseInputClass = `w-full bg-transparent py-2 text-base text-forest-900 placeholder:text-soga-400 focus:outline-none ${inputClassName}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-forest-900">
          {label}
        </label>
      ) : null}
      <div
        className={`flex min-h-11 items-center rounded-lg border bg-white px-3 transition-colors focus-within:ring-2 focus-within:ring-soga-700 ${
          error
            ? 'border-red-600 bg-red-50/40 focus-within:ring-red-500'
            : 'border-soga-400/70 hover:border-soga-600'
        }`}
      >
        {prefix ? (
          <span className="mr-2 select-none text-sm font-medium text-soga-700">{prefix}</span>
        ) : null}
        {isNumberType ? (
          <NumberInput
            id={id}
            allowDecimal={allowDecimal}
            className={baseInputClass}
            {...props}
          />
        ) : (
          <input
            id={id}
            type={type}
            className={baseInputClass}
            {...props}
          />
        )}
        {suffix ? (
          <span className="ml-2 select-none text-sm text-forest-800/70">{suffix}</span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-forest-800/70">{helperText}</p>
      ) : null}
    </div>
  );
}

export function Select({ id, label, helperText, error, children, className = '', ...props }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-forest-900">
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={`min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-base text-forest-900 transition-colors focus:outline-none focus:ring-2 focus:ring-soga-700 ${
          error ? 'border-red-600' : 'border-soga-400/70 hover:border-soga-600'
        }`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-forest-800/70">{helperText}</p>
      ) : null}
    </div>
  );
}
