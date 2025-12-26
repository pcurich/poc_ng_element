import { IDbConfig } from "./database.types";
import { HttpMethod } from "./http-mock.types";

export interface ServiceCodeWithStats {
  id: string;  
  serviceCode: string;  
  mockCount: number;
  methods: string[];
  lastUpdated?: Date;
}

export interface DatabaseStatus {
  exists: boolean;
  isInitialized: boolean;
  config?: IDbConfig;
  error?: string;
}

export interface IHttpMockStatistics {
  totalMocks: number;
  mocksByServiceCode: Record<string, number>;
  mocksByMethod: Record<HttpMethod | string, number>;
  mocksByStatusCode: Record<number, number>;
  averageDelayMs: number;
  mostUsedServiceCodes: Array<{ serviceCode: string; count: number }>;
}