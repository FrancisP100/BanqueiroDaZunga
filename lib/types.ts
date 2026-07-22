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
  leaderId?: string;          // ID do líder (chefe) a que este banqueiro está vinculado
  ativo: boolean;
  deveAlterarSenha?: boolean;
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

/** Pacote único: Zungueira. Dentro dele há classes */
export const PACOTE_UNICO = "Zungueira";

export const CLASSES_PACOTE = ["Mãezinha", "Mãe", "Mãe Grande", "Mamoite"] as const;
export type ClassePacote = (typeof CLASSES_PACOTE)[number];

/** Alias para compatibilidade com código existente */
export const PACOTES = CLASSES_PACOTE;
export type Pacote = ClassePacote;

export type TpaStatus = "pendente" | "entregue" | "sem_tpa" | "por_entregar" | "no_balcao";

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
  pacote: Pacote | string;        // classe do pacote (Mãezinha, Mãe, etc)
  pacoteNome?: string;             // nome do pacote (sempre "Zungueira")
  pacoteStatus?: string;
  tpaStatus: TpaStatus;
  mercadoId: string;
  mercadoNome: string;
  status: "aberta" | "pendente";
  numeroContaBanco?: string;
  dataActivacaoBanco?: string;
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
  primeiraPresenca?: boolean;
};

export type PunctualityRule = {
  horaLimite: string;
  toleranciaMin: number;
};

export type NotificationType = "alerta_tpa" | "abertura_conta" | "tpa_entregue" | "conta_ativada" | "tpa_no_balcao";

export type Notification = {
  id: string;
  leaderId: string;
  banqueiroId: string;
  clienteNome: string;
  clienteId?: string;
  contaId?: string;
  mensagem: string;
  tipo: NotificationType;
  descricao?: string;
  leaderNome?: string;
  lida: boolean;
  createdAt: string;
};

export type ReportPeriod = "dia" | "semana" | "mes" | "3meses" | "6meses" | "ano";

export type ReportSummary = {
  periodo: ReportPeriod;
  contasAbertas: number;
  pacotesVendidos: number;
  tpasEntregues: number;
  tpasPendentes: number;
};