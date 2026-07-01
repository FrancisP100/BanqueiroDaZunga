import { todayISO } from "@/lib/date";
import type { Account, Market, Presence, Profile, PunctualityRule } from "@/lib/types";

export const profiles: Profile[] = [
  {
    id: "profile-bz0174",
    email: "ana@bci.co.ao",
    nome: "Ana Silva Domingos",
    codigoInterno: "BZ0174",
    papel: "banqueiro",
    telefone: "923 111 222",
    provincia: "Luanda",
    localId: "market-30",
    numeroBalcao: "BCI-0030",
    ativo: true
  },
  {
    id: "profile-bz0142",
    email: "joao@bci.co.ao",
    nome: "Joao Kiala",
    codigoInterno: "BZ0142",
    papel: "banqueiro",
    telefone: "923 774 201",
    provincia: "Luanda",
    localId: "market-kikolo",
    numeroBalcao: "BCI-0142",
    ativo: true
  },
  {
    id: "profile-chefe-08",
    email: "carlos@bci.co.ao",
    nome: "Carlos Manuel Vitor",
    codigoInterno: "CH-08",
    papel: "chefe",
    provincia: "Luanda",
    ativo: true
  },
  {
    id: "profile-admin-01",
    email: "admin@bci.co.ao",
    nome: "Direccao BCI Inclusao",
    codigoInterno: "AD-01",
    papel: "admin",
    provincia: "Nacional",
    ativo: true
  }
];

export const markets: Market[] = [
  { id: "market-30", nome: "Mercado do 30", provincia: "Luanda", tipo: "mercado", balcao: "BCI-0030", latitude: -8.9256, longitude: 13.3612, raioMetros: 100 },
  { id: "market-kikolo", nome: "Mercado do Kikolo", provincia: "Luanda", tipo: "mercado", balcao: "BCI-0142", latitude: -8.7865, longitude: 13.2847, raioMetros: 100 },
  { id: "market-rocha", nome: "Mercado 4 de Abril - Rocha", provincia: "Benguela", tipo: "mercado", balcao: "BCI-0405", latitude: -12.5763, longitude: 13.4035, raioMetros: 100 }
];

export const accounts: Account[] = [
  { id: "CT-8214", createdAt: todayISO(), banqueiroId: "profile-bz0174", banqueiroNome: "Ana Silva Domingos", clienteId: "CL-01", clienteNome: "Rosa Capalo", bi: "002948221LA048", telefone: "945 221 009", celular: "945 221 009", endereco: "Mercado do 30, Banca 12", pacote: "Pacote Zungueira Plus", pacoteStatus: "ativo", tpaStatus: "entregue", mercadoId: "market-30", mercadoNome: "Mercado do 30", status: "aberta" },
  { id: "CT-8213", createdAt: todayISO(), banqueiroId: "profile-bz0174", banqueiroNome: "Ana Silva Domingos", clienteId: "CL-02", clienteNome: "Esperanca Tchitumba", bi: "008421994LA034", telefone: "932 112 880", celular: "932 112 880", endereco: "Mercado do 30, Banca 8", pacote: "Pacote Zungueira Basico", pacoteStatus: "ativo", tpaStatus: "por_entregar", mercadoId: "market-30", mercadoNome: "Mercado do 30", status: "aberta" },
  { id: "CT-8211", createdAt: todayISO(), banqueiroId: "profile-bz0142", banqueiroNome: "Joao Kiala", clienteId: "CL-03", clienteNome: "Madalena Sapalo", bi: "003821990LA012", telefone: "923 774 201", celular: "923 774 201", endereco: "Mercado do Kikolo, Banca 5", pacote: "Pacote Zungueira Empreendedora", pacoteStatus: "por_abrir", tpaStatus: "sem_tpa", mercadoId: "market-kikolo", mercadoNome: "Mercado do Kikolo", status: "pendente" }
];

export const presences: Presence[] = [
  { id: "PR-1291", profileId: "profile-bz0174", nome: "Ana Silva Domingos", data: todayISO(), entrada: "07:52", latitude: -8.9254, longitude: 13.3615, mercadoId: "market-30", mercadoNome: "Mercado do 30", status: "no_local", pontualidade: "no_horario", origem: "gps" },
  { id: "PR-1290", profileId: "profile-bz0142", nome: "Joao Kiala", data: todayISO(), entrada: "08:14", latitude: -8.7868, longitude: 13.2849, mercadoId: "market-kikolo", mercadoNome: "Mercado do Kikolo", status: "no_local", pontualidade: "atraso", origem: "gps" }
];

export const punctualityRule: PunctualityRule = {
  horaLimite: "08:00",
  toleranciaMin: 15
};
