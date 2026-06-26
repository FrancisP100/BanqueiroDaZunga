"use client";

import { useState, useTransition } from "react";
import type { Market } from "@/lib/types";
import { registerPresence } from "@/app/banqueiro/actions";

export function PresenceForm({ market }: { market: Market }) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState("Aguardando GPS do dispositivo.");
  const [isPending, startTransition] = useTransition();

  function capture() {
    if (!navigator.geolocation) {
      setMessage("GPS indisponivel neste dispositivo.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setMessage("Coordenadas capturadas. Pode marcar a entrada.");
      },
      () => setMessage("Nao foi possivel obter a localizacao.")
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <p className="rounded-xl bg-bci-bg px-4 py-3 text-sm font-semibold text-bci-muted">{message}</p>
      <button className="w-full rounded-xl border border-bci-line bg-white px-5 py-3 text-sm font-extrabold text-bci-ink" type="button" onClick={capture}>
        Obter localizacao GPS
      </button>
      <form
        action={(formData) => {
          if (!coords) return;
          formData.set("latitude", String(coords.latitude));
          formData.set("longitude", String(coords.longitude));
          startTransition(() => registerPresence(formData));
        }}
      >
        <input type="hidden" name="mercado_id" value={market.id} />
        <input type="hidden" name="latitude" value={coords?.latitude ?? ""} />
        <input type="hidden" name="longitude" value={coords?.longitude ?? ""} />
        <button disabled={!coords || isPending} className="w-full rounded-xl bg-bci-pink px-5 py-3 text-sm font-extrabold text-white shadow-pink disabled:cursor-not-allowed disabled:opacity-50" type="submit">
          {isPending ? "A guardar..." : "Marcar entrada"}
        </button>
      </form>
    </div>
  );
}
