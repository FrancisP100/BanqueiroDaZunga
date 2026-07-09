/**
 * lib/integrations/signing/types.ts
 *
 * Interfaces para recolha de assinatura digital.
 * Quando o sistema evoluir para eliminar papel, a assinatura
 * digital substitui a assinatura manuscrita nos documentos.
 */

import type { IntegrationAdapter } from "../types";

/** Input para solicitar uma assinatura */
export type SigningInput = {
  /** Documento a assinar (PDF, HTML, etc.) */
  document: Blob | string;
  /** Formato do documento */
  format: "pdf" | "html";
  /** ID do signatário (cliente_id) */
  signerId: string;
  /** Nome completo do signatário */
  signerName: string;
  /** BI do signatário */
  signerBi: string;
  /** Tipo de documento a assinar */
  documentType: "contrato_abertura" | "termo_responsabilidade" | "outro";
};

/** Resultado de uma assinatura */
export type SigningResult = {
  /** Documento assinado (PDF) */
  signedDocument: Blob;
  /** ID da prova de assinatura no sistema */
  proofId: string;
  /** Timestamp da assinatura */
  signedAt: string;
  /** Hash do documento assinado (para verificação futura) */
  checksum: string;
};

/** Adapter de assinatura digital */
export type SigningAdapter = IntegrationAdapter<SigningInput, SigningResult>;

/** Estado de uma solicitação de assinatura */
export type SigningRequest = {
  id: string;
  status: "pendente" | "assinado" | "recusado" | "expirado";
  signerId: string;
  documentType: string;
  createdAt: string;
  signedAt?: string;
};

/** Interface para provider de captura de assinatura (canvas/web) */
export type SignatureCaptureProvider = {
  /** Inicia a captura de assinatura (renderiza canvas) */
  startCapture(container: HTMLElement): void;
  /** Devolve a assinatura como Blob (PNG) */
  getSignature(): Promise<Blob>;
  /** Limpa a assinatura actual */
  clear(): void;
  /** Destroy o canvas */
  destroy(): void;
};
