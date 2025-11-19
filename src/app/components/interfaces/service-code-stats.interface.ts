/**
 * 📊 Interface para estadísticas de Service Codes
 * 
 * Contiene la estructura de datos para los códigos de servicio
 * con sus estadísticas correspondientes
 */

/**
 * Interface para representar un Service Code con sus estadísticas
 */
export interface ServiceCodeWithStats {
  /** ID único hash para el service code */
  id: string;
  
  /** Código del servicio */
  serviceCode: string;
  
  /** Número total de mocks asociados a este service code */
  mockCount: number;
  
  /** Lista de métodos HTTP utilizados por los mocks de este service */
  methods: string[];
}