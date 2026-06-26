import { hmToMinutes, todayISO } from "@/lib/date";
import type { Market, Presence, Profile, Punctuality, PunctualityRule } from "@/lib/types";

export function classifyPunctuality(entrada: string | undefined, rule: PunctualityRule): Punctuality {
  if (!entrada) return "falta";
  const entryMinutes = hmToMinutes(entrada);
  const limitMinutes = hmToMinutes(rule.horaLimite);
  if (entryMinutes === null || limitMinutes === null) return "atraso";
  return entryMinutes <= limitMinutes + rule.toleranciaMin ? "no_horario" : "atraso";
}

export function distanceInMeters(a: Pick<Market, "latitude" | "longitude">, b: Pick<Market, "latitude" | "longitude">) {
  const earthRadius = 6371e3;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRad(b.latitude - a.latitude);
  const deltaLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function buildMissingPresenceRows(
  profiles: Profile[],
  presences: Presence[],
  markets: Market[],
  rule: PunctualityRule,
  currentTime: string
) {
  const limitMinutes = hmToMinutes(rule.horaLimite);
  const nowMinutes = hmToMinutes(currentTime);
  if (limitMinutes === null || nowMinutes === null || nowMinutes <= limitMinutes + rule.toleranciaMin) {
    return [];
  }

  const today = todayISO();
  return profiles
    .filter((profile) => profile.papel === "banqueiro" && profile.ativo)
    .filter((profile) => !presences.some((presence) => presence.profileId === profile.id && presence.data === today))
    .map((profile) => {
      const market = markets.find((item) => item.id === profile.localId);
      return {
        id: `AUTO-${today}-${profile.codigoInterno}`,
        profileId: profile.id,
        nome: profile.nome,
        data: today,
        entrada: undefined,
        saida: undefined,
        mercadoId: market?.id,
        mercadoNome: market?.nome,
        status: "falta",
        pontualidade: "falta",
        origem: "automatica"
      } satisfies Presence;
    });
}
