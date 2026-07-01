export type UserRole = "banqueiro" | "chefe" | "admin"; // "chefe" continua no DB; UI mostra "Líder"

export type Profile = {
  id: string;
  email: string;
  nome: string;
  codigoInterno: string;
  papel: UserRole;
  telefone?: string;
  provincia?: string;
  localId?: string;
  numeroBalcao?: string;
  ativo: boolean;
};

export type Market = {
  id: string;
  nome: string;
  provincia: string;
  tipo: string;
  balcao?: string;
  latitude: number;
  longitude: number;
  raioMetros: number;
};

export const PACOTES = ["Mãezinha", "Mãe", "Mãe Grande"] as const;
export type Pacote = (typeof PACOTES)[number];

export type TpaStatus = "pendente" | "entregue" | "sem_tpa" | "por_entregar";

export type Account = {
  id: string;
  createdAt: string;
  horaAbertura?: string;
  banqueiroId: string;
  banqueiroNome: string;
  clienteId: string;
  clienteNome: string;
  bi: string;
  biEmissao?: string;
  biValidade?: string;
  telefone: string;
  celular?: string;
  endereco?: string;
  pacote: Pacote | string;
  pacoteStatus?: string;
  tpaStatus: TpaStatus;
  mercadoId: string;
  mercadoNome: string;
  status: "aberta" | "pendente";
};

export type PresenceStatus = "no_local" | "fora_do_local" | "falta";
export type Punctuality = "no_horario" | "atraso" | "falta";

export type Presence = {
  id: string;
  profileId: string;
  nome: string;
  data: string;
  entrada?: string;
  saida?: string;
  latitude?: number;
  longitude?: number;
  mercadoId?: string;
  mercadoNome?: string;
  status: PresenceStatus;
  pontualidade: Punctuality;
  origem: "gps" | "automatica" | "manual";
  observacao?: string;
  updatedAt?: string;
};

export type PunctualityRule = {
  horaLimite: string;
  toleranciaMin: number;
};

export type ReportPeriod = "dia" | "semana" | "mes" | "ano";

export type ReportSummary = {
  periodo: ReportPeriod;
  contasAbertas: number;
  pacotesVendidos: number;
  tpasEntregues: number;
  tpasPendentes: number;
};