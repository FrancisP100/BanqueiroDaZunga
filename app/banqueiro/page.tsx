"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  LogOut,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import Link from "next/link";

export default function BanqueiroDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPacotes: 0,
    tpaEntregues: 0,
    tpaPendentes: 0,
  });
  const [presencaHoje, setPresencaHoje] = useState<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, local_id")
        .eq("id", user.id)
        .single();
      if (!profile) return;

      const { data: accounts } = await supabase
        .from("accounts")
        .select("status, tpa_status")
        .eq("banqueiro_id", profile.id);
      if (accounts) {
        setStats({
          totalPacotes: accounts.length,
          tpaEntregues: accounts.filter((a) => a.tpa_status === "entregue")
            .length,
          tpaPendentes: accounts.filter((a) => a.tpa_status === "pendente")
            .length,
        });
      }

      const hoje = new Date().toISOString().split("T")[0];
      const { data: presenca } = await supabase
        .from("presences")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("data", hoje)
        .single();
      if (presenca) setPresencaHoje(presenca);

      setLoading(false);
    }
    loadDashboard();

    // Localização em tempo real
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 },
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const marcarPresenca = async () => {
    if (!navigator.geolocation) {
      alert("O seu navegador não suporta geolocalização.");
      return;
    }
    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setSubmitting(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, local_id")
          .eq("id", user.id)
          .single();
        if (!profile) {
          setSubmitting(false);
          return;
        }

        const hoje = new Date().toISOString().split("T")[0];
        const hora = new Date().toTimeString().split(" ")[0];

        const { error } = await supabase.from("presences").insert({
          profile_id: profile.id,
          data: hoje,
          entrada: hora,
          latitude,
          longitude,
          mercado_id: profile.local_id,
          status: "no_local",
          pontualidade: "no_horario",
          origem: "gps",
        });

        if (!error) {
          alert("Presença marcada com sucesso!");
          window.location.reload();
        } else alert("Erro ao marcar presença.");
        setSubmitting(false);
      },
      () => {
        alert("Não foi possível obter a sua localização.");
        setSubmitting(false);
      },
    );
  };

  const marcarSaida = async () => {
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    if (!profile) {
      setSubmitting(false);
      return;
    }

    const hoje = new Date().toISOString().split("T")[0];
    const hora = new Date().toTimeString().split(" ")[0];

    const { data: presenca } = await supabase
      .from("presences")
      .select("id, saida")
      .eq("profile_id", profile.id)
      .eq("data", hoje)
      .maybeSingle();

    if (!presenca) {
      alert("Registe primeiro a entrada da presença.");
      setSubmitting(false);
      return;
    }

    if (presenca.saida) {
      alert("A saída já foi registada hoje.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("presences")
      .update({ saida: hora, status: "fora_do_local" })
      .eq("id", presenca.id);

    if (!error) {
      alert("Saída registada com sucesso!");
      window.location.reload();
    } else alert("Erro ao marcar saída.");
    setSubmitting(false);
  };

  const tpaData = [
    { name: "Entregues", value: stats.tpaEntregues, color: "#10b981" },
    { name: "Pendentes", value: stats.tpaPendentes, color: "#f59e0b" },
  ];

  const mapsEmbedSrc = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`
    : null;

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        A carregar dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bci-dark">Dashboard</h1>
          <p className="text-gray-500">Resumo da sua atividade de hoje</p>
        </div>
        {presencaHoje ? (
          <div className="flex flex-wrap gap-2">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center font-medium">
              <CheckCircle2 className="mr-2" size={20} />
              Entrada {presencaHoje.entrada?.substring(0, 5)}
            </div>
            {presencaHoje.saida ? (
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg flex items-center font-medium">
                <Clock className="mr-2" size={20} />
                Saída {presencaHoje.saida?.substring(0, 5)}
              </div>
            ) : (
              <Button
                onClick={marcarSaida}
                disabled={submitting}
                className="bg-bci-dark hover:bg-bci-dark/90 text-white"
              >
                <LogOut className="mr-2" size={18} />{" "}
                {submitting ? "A guardar..." : "Marcar Saída"}
              </Button>
            )}
          </div>
        ) : (
          <Button
            onClick={marcarPresenca}
            disabled={submitting}
            className="bg-bci-magenta hover:bg-bci-magenta/90 text-white"
          >
            <MapPin className="mr-2" size={18} />{" "}
            {submitting ? "A guardar..." : "Marcar Presença (GPS)"}
          </Button>
        )}
      </div>

      {/* Localização em tempo real */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            A minha localização agora
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mapsEmbedSrc ? (
            <iframe
              title="Localização em tempo real"
              src={mapsEmbedSrc}
              className="w-full h-72 rounded-xl border-0"
              loading="lazy"
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl">
              A obter localização GPS…
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo da atividade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total de Pacotes
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.totalPacotes}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                TPA's Entregues
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.tpaEntregues}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                TPA's Pendentes
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.tpaPendentes}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            TPA's pendentes e entregues
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {stats.totalPacotes > 0 ? (
            <div className="h-full min-h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tpaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tpaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Sem dados suficientes
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <Link href="/banqueiro/abrir-conta">
          <Button className="w-full sm:w-auto bg-bci-dark hover:bg-bci-dark/90 text-white font-semibold py-6 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
            <CreditCard className="mr-3" size={24} /> Abrir Nova Conta
          </Button>
        </Link>
      </div>
    </div>
  );
}
