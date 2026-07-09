/**
 * lib/integrations/types.ts
 *
 * Interfaces base para todos os adapters de integração.
 * Cada integração futura (MinFin, QR Code, OCR, API Bancária, etc.)
 * deve implementar IntegrationAdapter<TInput, TOutput>.
 */

/** Resultado padronizado de qualquer operação de integração */
export type IntegrationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fallback: true }; // fallback = usa método manual

/** Metadados de uma integração (para UI de administração) */
export type IntegrationMeta = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  available: boolean;
  version: string;
};

/** Interface base que toda a integração deve implementar */
export interface IntegrationAdapter<TInput, TOutput> {
  /** Identificador único (ex.: "minfin-bi-validation") */
  readonly id: string;
  /** Nome legível (ex.: "Validação de BI — MinFin") */
  readonly name: string;
  /** Se está ligada na configuração actual */
  readonly enabled: boolean;

  /** Verifica se o adapter pode ser usado (credenciais OK, API reachable, etc.) */
  isAvailable(): boolean;

  /** Obtém metadados para exibição */
  getMeta(): IntegrationMeta;

  /** Executa a operação principal */
  execute(input: TInput): Promise<IntegrationResult<TOutput>>;
}

/**
 * Interface para integrações que envolvem validação de documentos/identidade.
 * Ex.: MinFin BI, NIF, QR Code do BI, OCR
 */
export interface ValidationAdapter<TInput, TOutput>
  extends IntegrationAdapter<TInput, TOutput> {
  /** Percentagem de confiança na validação (0-1). < 1 → requer revisão manual */
  confidence?: number;
}

/**
 * Interface para integrações de armazenamento/upload.
 * Ex.: Supabase Storage, AWS S3, etc.
 */
export interface StorageAdapter<TInput = File, TOutput = { url: string }>
  extends IntegrationAdapter<TInput, TOutput> {
  upload(input: TInput): Promise<IntegrationResult<TOutput>>;
  delete(id: string): Promise<IntegrationResult<void>>;
  getUrl(id: string): string | null;
}

/**
 * Tipo para Feature Flag de integração — define se está activa e
 * qual adapter usar.
 */
export type IntegrationFeatureFlag = {
  enabled: boolean;
  adapterId?: string; // Se vazio, procura o primeiro adapter disponível
};

/** Configuração global de integrações (carregada de env vars / DB) */
export type IntegrationsConfig = {
  biValidation: IntegrationFeatureFlag;
  documentStorage: IntegrationFeatureFlag;
  banking: IntegrationFeatureFlag;
  digitalSigning: IntegrationFeatureFlag;
  ocr: IntegrationFeatureFlag;
  qrCode: IntegrationFeatureFlag;
};

/** Configuração por defeito — todas desligadas */
export const DEFAULT_INTEGRATIONS_CONFIG: IntegrationsConfig = {
  biValidation: { enabled: false },
  documentStorage: { enabled: false },
  banking: { enabled: false },
  digitalSigning: { enabled: false },
  ocr: { enabled: false },
  qrCode: { enabled: false },
};
