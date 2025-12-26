import { IEntityMetadata, IPropertyMetadata } from '../types/entity.types';
import { HttpMethod, IHttpMockData } from '../types/http-mock.types';
import { AuditableEntity } from './base/AuditableEntity';


/**
 * Entidad HttpMock que extiende AuditableEntity
 * Proporciona funcionalidades completas de auditoría y validación
 */
export class HttpMockEntity extends AuditableEntity implements IHttpMockData {
  public override id!: string;
  public name!: string;
  public serviceCode!: string;
  public url!: string;
  public method!: HttpMethod | string;
  public httpCodeResponseValue!: number;
  public delayMs!: number;
  public headers?: Record<string, string>;
  public responseBody!: string;

  /**
   * Constructor con inicialización de datos
   */
  constructor(data?: Partial<HttpMockEntity>) {
    super(data);

    if (data) {
      this.name = data.name || '';
      this.serviceCode = data.serviceCode || '';
      this.url = data.url || '';
      this.method = data.method || 'GET';
      this.httpCodeResponseValue = data.httpCodeResponseValue || 200;
      this.delayMs = data.delayMs || 0;
      this.headers = data.headers ? { ...data.headers } : {};
      this.responseBody = data.responseBody || '{}';
    }
  }

  /**
   * Implementación de metadatos de la entidad
   */
  public getMetadata(): IEntityMetadata {
    const properties: IPropertyMetadata[] = [
      {
        name: 'id',
        type: 'string',
        required: true,
        primaryKey: true,
        description: 'Identificador único del mock HTTP'
      },
      {
        name: 'name',
        type: 'string',
        required: false,
        maxLength: 100,
        description: 'Nombre descriptivo del mock'
      },
      {
        name: 'serviceCode',
        type: 'string',
        required: true,
        maxLength: 50,
        description: 'Código del servicio para agrupación'
      },
      {
        name: 'url',
        type: 'string',
        required: true,
        maxLength: 500,
        description: 'URL o patrón de URL a interceptar'
      },
      {
        name: 'method',
        type: 'string',
        required: true,
        enumValues: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const,
        description: 'Método HTTP a interceptar'
      },
      {
        name: 'httpCodeResponseValue',
        type: 'number',
        required: true,
        min: 100,
        max: 599,
        description: 'Código de respuesta HTTP a simular'
      },
      {
        name: 'delayMs',
        type: 'number',
        required: true,
        min: 0,
        description: 'Delay en milisegundos antes de responder'
      },
      {
        name: 'headers',
        type: 'object',
        required: false,
        description: 'Headers de respuesta personalizados'
      },
      {
        name: 'responseBody',
        type: 'string',
        required: true,
        description: 'Cuerpo de la respuesta como string JSON'
      }
    ];

    return {
      tableName: 'httpMocks',
      primaryKey: 'id',
      properties,
      indexes: [
        { name: 'serviceCode', keyPath: 'serviceCode' },
        { name: 'url', keyPath: 'url' },
        { name: 'method', keyPath: 'method' }
      ],
      version: 1
    };
  }

  /**
   * Validación personalizada adicional
   */
  public override validate(): { isValid: boolean; errors: string[] } {
    const baseValidation = super.validate();
    const errors = [...baseValidation.errors];

    // Validar formato de URL básico
    if (this.url && !this.isValidUrlPattern(this.url)) {
      errors.push('URL debe tener un formato válido');
    }

    // Validar que responseBody sea JSON válido si no está vacío
    if (this.responseBody && this.responseBody.trim() !== '') {
      try {
        JSON.parse(this.responseBody);
      } catch {
        errors.push('Response body debe ser JSON válido');
      }
    }

    // Validar headers si existen
    if (this.headers) {
      for (const [key, value] of Object.entries(this.headers)) {
        if (typeof key !== 'string' || typeof value !== 'string') {
          errors.push('Todos los headers deben ser cadenas');
          break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validación básica de patrón de URL
   */
  private isValidUrlPattern(url: string): boolean {
    // Permite URLs completas, rutas relativas y patrones con wildcards
    const urlPattern = /^(https?:\/\/|\/|\.\/|\*|[a-zA-Z0-9])/;
    return urlPattern.test(url.trim());
  }



  /**
   * Convierte la entidad a un objeto plano para almacenamiento
   */
  public override toPlainObject(): IHttpMockData {
    return {
      ...super.toPlainObject(),
      name: this.name,
      serviceCode: this.serviceCode,
      url: this.url,
      method: this.method,
      httpCodeResponseValue: this.httpCodeResponseValue,
      delayMs: this.delayMs,
      headers: this.headers ? { ...this.headers } : undefined,
      responseBody: this.responseBody,
      id: this.id
    };
  }

  // === Métodos de negocio específicos ===

  /**
   * Verifica si este mock coincide con una petición HTTP
   */
  public matchesRequest(url: string, method: string): boolean {
    const methodMatches = this.method.toUpperCase() === method.toUpperCase();
    const urlMatches = this.matchesUrl(url);

    return methodMatches && urlMatches;
  }

  /**
   * Verifica si la URL coincide con el patrón del mock
   */
  private matchesUrl(requestUrl: string): boolean {
    const mockUrl = this.url.toLowerCase();
    const testUrl = requestUrl.toLowerCase();

    // Coincidencia exacta
    if (mockUrl === testUrl) {
      return true;
    }

    // Patrones con wildcards simples
    if (mockUrl.includes('*')) {
      const pattern = mockUrl.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(testUrl);
    }

    // Coincidencia por prefijo (para APIs REST)
    if (testUrl.startsWith(mockUrl)) {
      return true;
    }

    return false;
  }

  /**
   * Obtiene la respuesta simulada
   */
  public getResponse(): {
    status: number;
    headers: Record<string, string>;
    body: string;
    delay: number;
  } {
    return {
      status: this.httpCodeResponseValue,
      headers: this.headers || {},
      body: this.responseBody,
      delay: this.delayMs
    };
  }

  /**
   * Actualiza el cuerpo de respuesta
   */
  public updateResponseBody(newBody: string): void {
    try {
      // Validar que sea JSON válido
      JSON.parse(newBody);
      this.responseBody = newBody;
      this.touch();
    } catch (error) {
      throw new Error('El nuevo response body debe ser JSON válido');
    }
  }

  /**
   * Actualiza el delay de respuesta
   */
  public updateDelay(newDelayMs: number): void {
    if (newDelayMs < 0) {
      throw new Error('El delay no puede ser negativo');
    }

    this.delayMs = newDelayMs;
    this.touch();
  }

  /**
   * Agrega o actualiza un header
   */
  public setHeader(key: string, value: string): void {
    if (!this.headers) {
      this.headers = {};
    }

    this.headers[key] = value;
    this.touch();
  }

  /**
   * Elimina un header
   */
  public removeHeader(key: string): void {
    if (this.headers && this.headers[key]) {
      delete this.headers[key];
      this.touch();
    }
  }

  /**
   * Clona el mock 
   */
  public override clone(): this {
    const currentData = this.toPlainObject();
    const Constructor = this.constructor as new (data?: any) => this;
    return new Constructor(currentData);
  }

  /**
   * Clona el mock con datos personalizados
   */
  public cloneWith(overrides: Partial<IHttpMockData>): HttpMockEntity {
    const currentData = this.toPlainObject();
    return new HttpMockEntity({ ...currentData, ...overrides });
  }
}

export { HttpMethod, IHttpMockData };
