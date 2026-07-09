"use client";

import { useState, useTransition } from "react";
import type { Market } from "@/lib/types";
import { distanceInMeters } from "@/lib/attendance";
import { registerPresence } from "@/app/banqueiro/actions";

export function PresenceForm({ market }: { market: Market }) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState("Aguardando GPS do dispositivo.");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [isPending, startTransition] = useTransition();

  function capture() {
    if (!navigator.geolocation) {
      setMessage("GPS indisponivel neste dispositivo.");
      setMessageType("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Validate distance to market
        const distance = distanceInMeters(
          { latitude: userLat, longitude: userLng },
          { latitude: market.latitude, longitude: market.longitude }
        );

        const maxRadius = market.raioMetros || 100;

        if (distance <= maxRadius) {
          setCoords({ latitude: userLat, longitude: userLng });
          setMessage(`✅ Dentro do raio permitido (${Math.round(distance)}m / ${maxRadius}m). Pode marcar entrada.`);
          setMessageType("success");
        } else {
          setCoords(null);
          setMessage(`❌ Fora do raio permitido! Está a ${Math.round(distance)}m do mercado (limite: ${maxRadius}m). Aproxime-se do mercado.`);
          setMessageType("error");
        }
      },
      () => {
        setMessage("Nao foi possivel obter a localizacao.");
        setMessageType("error");
      }
    );
  }

  const messageColors = {
    info: "text-bci-muted",
    success: "text-emerald-700",
    error: "text-red-600",
  };

  return (
    <div className="mt-5 space-y-3">
      <p className={`rounded-xl bg-bci-bg px-4 py-3 text-sm font-semibold ${messageColors[messageType]}`}>
        {message}
      </p>
      <button className="w-full rounded-xl border border-bci-line bg-white px-5 py-3 text-sm font-extrabold text-bci-ink hover:bg-bci-bg transition-colors" type="button" onClick={capture}>
        Obter localização GPS
      </button>
      <form
        action={async (formData) => {
          if (!coords) return;
          formData.set("latitude", String(coords.latitude));
          formData.set("longitude", String(coords.longitude));
          startTransition(async () => { await registerPresence(formData); });
        }}
      >
        <input type="hidden" name="mercado_id" value={market.id} />
        <input type="hidden" name="latitude" value={coords?.latitude ?? ""} />
        <input type="hidden" name="longitude" value={coords?.longitude ?? ""} />
        <button disabled={!coords || isPending} className="w-full rounded-xl bg-bci-pink px-5 py-3 text-sm font-extrabold text-white shadow-pink disabled:cursor-not-allowed disabled:opacity-50 hover:bg-bci-pink/90 transition-colors" type="submit">
          {isPending ? "A guardar..." : "Marcar entrada"}
        </button>
      </form>
    </div>
  );
}
