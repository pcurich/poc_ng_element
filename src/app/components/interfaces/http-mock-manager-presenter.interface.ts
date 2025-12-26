import { Observable } from 'rxjs';
import { HttpMockEntity, IHttpMockStatistics } from '../../../core';
import { ValidationMessage } from '../../../core/constants/validation-messages';
 

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
  statistics: IHttpMockStatistics | null;
  selectedServiceCode: string | null;
  lastOperation: string | null;
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