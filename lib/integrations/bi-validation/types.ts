/**
 * lib/integrations/bi-validation/types.ts
 *
 * Interfaces para validação de Bilhete de Identidade.
 * Quando o MinFin disponibilizar API, ou quando o QR Code/OCR
 * estiver implementado, o adapter respectivo implementa estas interfaces.
 */

import type { ValidationAdapter } from "../types";

/** Dados extraídos da validação do BI */
export type BiValidationResult = {
  /** Número do BI validado */
  biNumber: string;
  /** Nome completo do titular */
  nome: string;
  /** Data de nascimento (ISO) */
  dataNascimento: string;
  /** Número de Identificação Fiscal */
  nif: string;
  /** Morada */
  endereco: string;
  /** Nacionalidade */
  nacionalidade: string;
  /** Nome da mãe */
  nomeMae?: string;
  /** Nome do pai */
  nomePai?: string;
  /** Sexo */
  sexo?: "M" | "F";
  /** Estado civil */
  estadoCivil?: string;
  /** Profissão */
  profissao?: string;
};

/** Input para validação de BI */
export type BiValidationInput = {
  /** Número do BI */
  biNumber: string;
  /** Data de emissão (opcional, para validar se o documento está actualizado) */
  dataEmissao?: string;
};

/** Adapter de validação de BI */
export type BiValidationAdapter = ValidationAdapter<
  BiValidationInput,
  BiValidationResult
>;

// ─── Tipos específicos para QR Code do BI ──────────────────────

/** Dados lidos do QR Code do novo BI angolano */
export type QrCodeBiData = {
  biNumber: string;
  nome: string;
  dataNascimento: string;
  nif: string;
  /** Dados adicionais que o QR Code possa conter */
  raw: Record<string, string>;
};

export type QrCodeInput = {
  /** Imagem (base64 ou Blob) do QR Code scaneado */
  image: Blob | string;
};

/** Adapter de leitura de QR Code do BI */
export type QrCodeAdapter = ValidationAdapter<QrCodeInput, QrCodeBiData>;

// ─── Tipos específicos para OCR ────────────────────────────────

export type OcrInput = {
  /** Imagem do BI (fotografia ou digitalização) */
  image: Blob | string;
};

export type OcrResult = BiValidationResult & {
  /** Percentagem de confiança do OCR (0-1) */
  confidence: number;
};

/** Adapter de OCR para leitura automática do BI */
export type OcrAdapter = ValidationAdapter<OcrInput, OcrResult>;
