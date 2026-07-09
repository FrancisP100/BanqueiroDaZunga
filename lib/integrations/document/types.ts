/**
 * lib/integrations/document/types.ts
 *
 * Interfaces para armazenamento e gestão de documentos.
 * Aqui encaixam: Supabase Storage, AWS S3, DigitalOcean Spaces, etc.
 */

import type { StorageAdapter } from "../types";

/** Metadados de um documento armazenado */
export type DocumentMeta = {
  id: string;
  /** Nome original do ficheiro */
  fileName: string;
  /** Tipo MIME (image/jpeg, application/pdf, etc.) */
  mimeType: string;
  /** Tamanho em bytes */
  size: number;
  /** URL público (se aplicável) */
  url: string;
  /** Timestamp de upload */
  uploadedAt: string;
  /** Hash do ficheiro (para integridade) */
  checksum?: string;
};

/** Input para upload de documento */
export type DocumentUploadInput = {
  /** Ficheiro a fazer upload */
  file: File | Blob;
  /** Caminho/pasta no storage */
  path?: string;
  /** Tipo de documento (ex.: "bi_front", "bi_back", "selfie") */
  documentType: string;
  /** ID da entidade associada (ex.: cliente_id) */
  entityId: string;
};

/** Resultado de upload */
export type DocumentUploadResult = {
  /** Metadados do documento */
  document: DocumentMeta;
};

/** Filtros para listar documentos */
export type DocumentFilter = {
  entityId?: string;
  documentType?: string;
  limit?: number;
  offset?: number;
};

/** Adapter de armazenamento de documentos */
export type DocumentStorageAdapter = StorageAdapter<
  DocumentUploadInput,
  DocumentUploadResult
> & {
  /** Lista documentos com filtros */
  list(filter?: DocumentFilter): Promise<DocumentMeta[]>;
};

/**
 * Categorias de documentos no sistema.
 * Cada tipo pode ter regras diferentes (obrigatório, múltiplo, etc.)
 */
export const DOCUMENT_TYPES = [
  "bi_front",        // Frente do BI
  "bi_back",         // Verso do BI
  "selfie",          // Selfie do cliente
  "comprovativo_residencia",
  "declaracao_rendimentos",
  "contrato_abertura",
  "outro",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
