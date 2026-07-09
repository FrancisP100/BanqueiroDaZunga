/**
 * lib/integrations/banking/types.ts
 *
 * Interfaces para integração com o sistema bancário oficial.
 * Quando o banco disponibilizar API para abertura de contas,
 * o adapter respectivo implementa estas interfaces.
 */

import type { IntegrationAdapter } from "../types";

// ─── Abertura de Contas ────────────────────────────────────────

export type CreateAccountInput = {
  /** Dados do cliente validados */
  cliente: {
    nome: string;
    bi: string;
    nif?: string;
    telefone: string;
    endereco: string;
    dataNascimento?: string;
  };
  /** Tipo de pacote */
  pacote: string;
  /** Código do balcão de abertura */
  balcao: string;
  /** Código interno do banqueiro */
  banqueiroCodigo: string;
};

export type CreateAccountResult = {
  /** Número de conta gerado pelo banco */
  contaNumero: string;
  /** ID do processo no sistema bancário */
  processoId: string;
  /** Estado actual no sistema bancário */
  status: "pendente" | "aprovada" | "rejeitada";
  /** Mensagem do sistema bancário */
  mensagem?: string;
};

/** Adapter de integração bancária */
export type BankingAdapter = IntegrationAdapter<
  CreateAccountInput,
  CreateAccountResult
> & {
  /** Consulta estado de um processo */
  checkStatus(processoId: string): Promise<{
    status: "pendente" | "aprovada" | "rejeitada";
    mensagem?: string;
  }>;
};

// ─── Consultas ─────────────────────────────────────────────────

export type ConsultaClienteInput = {
  bi: string;
};

export type ConsultaClienteResult = {
  encontrado: boolean;
  nome?: string;
  dataNascimento?: string;
  nif?: string;
  morada?: string;
  /** Se o cliente já tem conta no banco */
  jaTemConta?: boolean;
  numeroConta?: string;
};
