export type ContextType = 'mock' | 'real' | 'hybrid';

export interface ContextOption {
  value: ContextType;
  label: string;
  description: string;
  icon: string;
}
