export type UserRole = "banqueiro" | "chefe" | "admin";

export type Profile = {
  id: string;
  email: string;
  nome: string;
  codigoInterno: string;
  papel: UserRole;
  telefone?: string;
  provincia?: string;
  localId?: string;
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

export type Account = {
  id: string;
  createdAt: string;
  banqueiroId: string;
  banqueiroNome: string;
  clienteNome: string;
  bi: string;
  telefone: string;
  celular?: string;
  endereco?: string;
  pacote: string;
  pacoteStatus: "ativo" | "por_abrir";
  tpaStatus: "entregue" | "por_entregar" | "sem_tpa";
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
};

export type PunctualityRule = {
  horaLimite: string;
  toleranciaMin: number;
};
