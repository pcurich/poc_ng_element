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
 * Eventos reactivos del presenter
 */
export interface IHttpMockManagerPresenterEvents {
  onMockCreated: Observable<HttpMockEntity>;
  onMockDeleted: Observable<string>;
  onMocksLoaded: Observable<HttpMockEntity[]>;
  onError: Observable<string>;
  onStateChanged: Observable<IHttpMockManagerPresenterState>;
}