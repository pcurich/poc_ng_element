/**
 * 📊 Service Code Statistics Interface
 * 
 * Interface for service code statistics used across the ORM system
 */

/**
 * Interface representing a Service Code with its statistics
 */
export interface ServiceCodeWithStats {
  /** Unique hash ID for the service code */
  id: string;
  
  /** Service code identifier */
  serviceCode: string;
  
  /** Total number of mocks associated with this service code */
  mockCount: number;
  
  /** List of HTTP methods used by mocks of this service */
  methods: string[];
  
  /** Last update timestamp */
  lastUpdated?: Date;
}
