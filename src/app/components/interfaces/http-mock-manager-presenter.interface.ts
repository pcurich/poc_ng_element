import { Observable } from 'rxjs';
import { HttpMockEntity } from '../../../core/models/HttpMockEntity';

/**
 * 🎭 Interfaces para HttpMockManagerPresenter
 * 
 * Contiene todas las interfaces relacionadas con el estado
 * y eventos del presenter en la arquitectura MVP.
 */

/**
 * Estado del presenter para HttpMockManager
 */
export interface IHttpMockManagerPresenterState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  currentMocks: HttpMockEntity[];
  statistics: any | null;
  selectedServiceCode: string | null;
  lastOperation: string | null;
}

/**
 * Tipo de mensaje de validación
 */
export type ValidationMessageType = 'success' | 'error' | 'warning' | 'info';

/**
 * Estructura de mensaje de validación
 */
export interface ValidationMessage {
  type: ValidationMessageType;
  text: string;
  durationMs?: number;
}

/**
 * Eventos reactivos del presenter
 */
export interface IHttpMockManagerPresenterEvents {
  onMockCreated: Observable<HttpMockEntity>;
  onMockDeleted: Observable<string>;
  onMocksLoaded: Observable<HttpMockEntity[]>;
  onError: Observable<string>;
  onStateChanged: Observable<IHttpMockManagerPresenterState>;
  onValidationMessage: Observable<ValidationMessage>;
}