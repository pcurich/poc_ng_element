import { ExportType } from "./export.types";

export interface ValidationResult {
  isValid: boolean;
  type: ExportType;
  errors: string[];
  warnings: string[];
}