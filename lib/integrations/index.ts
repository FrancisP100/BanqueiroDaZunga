/**
 * lib/integrations/index.ts
 *
 * Barrel export — importações limpas para o resto da aplicação.
 *
 * Uso:
 *   import { registry } from "@/lib/integrations";
 *   import type { IntegrationAdapter } from "@/lib/integrations";
 */

export { registry } from "./registry";
export type {
  IntegrationAdapter,
  IntegrationResult,
  IntegrationMeta,
  IntegrationsConfig,
  ValidationAdapter,
  StorageAdapter,
} from "./types";
export { DEFAULT_INTEGRATIONS_CONFIG } from "./types";

// Tipos específicos de cada domínio
export type { BiValidationAdapter, BiValidationInput, BiValidationResult } from "./bi-validation/types";
export type { DocumentStorageAdapter, DocumentMeta, DocumentUploadInput, DocumentUploadResult } from "./document/types";
export type { BankingAdapter, CreateAccountInput, CreateAccountResult } from "./banking/types";
export type { SigningAdapter, SigningInput, SigningResult } from "./signing/types";
