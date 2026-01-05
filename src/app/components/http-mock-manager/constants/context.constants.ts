import { ContextOption, ContextType } from '../interfaces';

export const CONTEXT_OPTIONS: readonly ContextOption[] = [
  {
    value: 'mock',
    label: 'Mock',
    description: 'Usar respuestas simuladas',
    icon: '🎭'
  },
  {
    value: 'real',
    label: 'Real',
    description: 'Usar servicios reales',
    icon: '🌐'
  },
  {
    value: 'hybrid',
    label: 'Híbrido',
    description: 'Combinar mock y real',
    icon: '⚡'
  }
] as const;


export const DEFAULT_CONTEXT: ContextType = 'mock';
