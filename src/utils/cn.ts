type ClassValue = string | number | boolean | null | undefined;

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join(' ');
}
