import React, { useEffect, useState } from "react";
import { Trophy, Coins, Users } from "lucide-react";
import { apiFetch } from "../lib/utils";

interface LeaderboardUser {
  rank: number;
  name: string;
  credits: number;
  añoIngreso?: string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/api/users/leaderboard");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "Error al cargar el ranking");
      }
      const data = await res.json();
      setLeaderboard(data as LeaderboardUser[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={28} className="text-yellow-800 animate-pulse" />;
      case 2:
        return <Trophy size={24} className="text-gray-400" />;
      case 3:
        return <Trophy size={22} className="text-amber-800" />;
      default:
        return <span className="text-2xl font-black text-slate-600">{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-blue-900/50 via-red-900/50 to-blue-950/50 rounded-[3rem] border border-blue-800/50 p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 bg-yellow-800/10 px-6 py-3 rounded-full mb-6">
              <Trophy size={28} className="text-yellow-800" />
              <span className="font-black text-yellow-800 uppercase tracking-widest text-sm">
                Top 10
              </span>
            </div>
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-3">
              Ranking de <span className="text-yellow-700">Monedas</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Los líderes de la economía del Foro-COAR
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
              <p className="text-red-400 font-bold">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                Cargando ranking...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.length === 0 ? (
                <div className="text-center py-16">
                  <Users size={64} className="text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">
                    Aún no hay usuarios en el ranking
                  </p>
                </div>
              ) : (
                leaderboard.map((user) => (
                  <div
                    key={user.rank}
                    className={`bg-slate-900/80 rounded-2xl p-6 border transition-all ${
                      user.rank === 1
                        ? "border-yellow-800/50 bg-gradient-to-r from-yellow-800/10 to-orange-900/10 shadow-lg"
                        : user.rank === 2
                        ? "border-gray-400/30 bg-gradient-to-r from-gray-500/10 to-slate-800"
                        : user.rank === 3
                        ? "border-amber-800/30 bg-gradient-to-r from-amber-800/10 to-slate-800"
                        : "border-slate-800 hover:border-blue-700/30"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 flex items-center justify-center">
                        {getRankIcon(user.rank)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black text-white">
                            {user.name}
                          </h3>
                          {user.añoIngreso && (
                            <span className="text-xs font-bold px-3 py-1 bg-slate-800 rounded-full text-slate-400 uppercase tracking-widest">
                              Ingreso {user.añoIngreso}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-yellow-800/10 px-5 py-3 rounded-xl">
                        <Coins size={24} className="text-yellow-800" />
                        <span className="text-2xl font-black text-yellow-700">
                          {user.credits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-slate-600 text-sm">
              💡 Gana más créditos participando en el foro y las apuestas!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
