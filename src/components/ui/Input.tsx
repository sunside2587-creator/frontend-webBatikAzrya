import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';
import { formatThousandInput, parseThousandInput } from '../../utils/formatters';

function isStepDecimal(step: string | number | undefined): boolean {
  if (step === undefined || step === null || step === '' || step === 'any') return false;
  const num = Number(step);
  return Number.isFinite(num) && num > 0 && num < 1;
}

function getCursorIndex(
  formatted: string,
  significantCount: number,
  allowDecimal: boolean
): number {
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

export interface NumberInputSyntheticEvent {
  target: {
    value: string;
    name?: string;
    id?: string;
  };
  currentTarget: {
    value: string;
    name?: string;
    id?: string;
  };
}

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value?: number | string;
  onChange?: (event: NumberInputSyntheticEvent) => void;
  allowDecimal?: boolean;
}

export function NumberInput({
  value,
  onChange,
  onFocus,
  onBlur,
  allowDecimal,
  step,
  min: _min,
  max: _max,
  name,
  id,
  className = '',
  ...props
}: NumberInputProps) {
  void _min;
  void _max;
  const isDecimal = allowDecimal ?? isStepDecimal(step);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isFocusedRef = useRef(false);
  const cursorPosRef = useRef<number | null>(null);

  const [displayValue, setDisplayValue] = useState<string>(() =>
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

  const emitChange = (nextVal: string) => {
    if (!onChange) return;
    onChange({
      target: { value: nextVal, name, id },
      currentTarget: { value: nextVal, name, id },
    });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    emitChange(parsed);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;
    if (displayValue.endsWith(',')) {
      const cleaned = parseThousandInput(displayValue.slice(0, -1), isDecimal);
      emitChange(cleaned);
      setDisplayValue(formatThousandInput(cleaned, isDecimal));
    } else {
      setDisplayValue(formatThousandInput(value, isDecimal));
    }
    onBlur?.(e);
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

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  inputClassName?: string;
  allowDecimal?: boolean;
  value?: number | string;
  onChange?: (
    event: ChangeEvent<HTMLInputElement> | NumberInputSyntheticEvent
  ) => void;
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
  value,
  onChange,
  ...props
}: InputProps) {
  const isNumberType = type === 'number';
  const baseInputClass = cn(
    'w-full bg-transparent py-2 text-base text-forest-900 placeholder:text-soga-400 focus:outline-none',
    inputClassName
  );

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-forest-900">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          'flex min-h-11 items-center rounded-lg border bg-white px-3 transition-colors focus-within:ring-2 focus-within:ring-soga-700',
          error
            ? 'border-red-600 bg-red-50/40 focus-within:ring-red-500'
            : 'border-soga-400/70 hover:border-soga-600'
        )}
      >
        {prefix ? (
          <span className="mr-2 select-none text-sm font-medium text-soga-700">
            {prefix}
          </span>
        ) : null}
        {isNumberType ? (
          <NumberInput
            id={id}
            allowDecimal={allowDecimal}
            value={value}
            onChange={onChange as NumberInputProps['onChange']}
            className={baseInputClass}
            {...props}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange as InputHTMLAttributes<HTMLInputElement>['onChange']}
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

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  children: ReactNode;
}

export function Select({
  id,
  label,
  helperText,
  error,
  children,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-forest-900">
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={cn(
          'min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-base text-forest-900 transition-colors focus:outline-none focus:ring-2 focus:ring-soga-700',
          error ? 'border-red-600' : 'border-soga-400/70 hover:border-soga-600'
        )}
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
