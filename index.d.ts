/**
 * 📦 Type definitions for poc-ng-element
 * 
 * This package exports a self-contained Web Component.
 * Importing this package will register the <http-mock-manager> custom element.
 */

export interface ContextOption {
  id: number;
  value: string;
  useMock: boolean;
}

export interface MockSchema {
  // Define properties based on usage
  [key: string]: any;
}

export interface MockBody {
  [key: string]: any;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export declare class HttpMockManagerComponent extends HTMLElement {
  selectedContext?: ContextOption;
  contextOptions: ContextOption[];
  httpMethods: HttpMethod[];
  httpCodeResponse: number[];
  headers: Record<string, string>;
  nameMock: string;
  serviceCode: string;
  url: string;
  httpMethod: HttpMethod;
  httpCodeResponseValue: number;
  delayMs: number;
  responseBody: string;
  dbName: string;
  dbVersion: number;
  dbObjectStoreName: string;
  dbKeyPath: string;

  // Events are dispatched as CustomEvents in Web Components
  addEventListener(type: 'saveMockSchemaEvent', listener: (event: CustomEvent<MockSchema>) => void): void;
  addEventListener(type: 'saveMockBodyEvent', listener: (event: CustomEvent<MockBody>) => void): void;
  addEventListener(type: 'saveHeadersEvent', listener: (event: CustomEvent<Record<string, string>>) => void): void;
  addEventListener(type: 'databaseCreatedEvent', listener: (event: CustomEvent<void>) => void): void;
  addEventListener(type: 'deleteContextEvent', listener: (event: CustomEvent<number>) => void): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'http-mock-manager': HttpMockManagerComponent;
  }
}
